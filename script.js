const form = document.getElementById("searchForm");
const input = document.getElementById("searchInput");
const results = document.getElementById("results");
const statusText = document.getElementById("status");

const modal = document.getElementById("videoModal");
const closeBtn = document.getElementById("closeModal");

const API_KEY = config.YOUTUBE_API_KEY;

let player;

function setStatus(message){
    statusText.textContent = message;
}

function escapeHtml(str){
    return str
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;");
}

function renderEmpty(message){
    results.innerHTML = `
        <div class="empty-state">
            ${message}
        </div>
    `;
}

async function searchVideos(query){

    const url = new URL(
        "https://www.googleapis.com/youtube/v3/search"
    );

    url.searchParams.set("part","snippet");
    url.searchParams.set("type","video");
    url.searchParams.set("maxResults","10");
    url.searchParams.set("q",query);
    url.searchParams.set("key",API_KEY);

    const response = await fetch(url);

    const data = await response.json();

    if(!response.ok){
        throw new Error(
            data?.error?.message || "API Error"
        );
    }

    return data.items;
}

function renderVideos(videos){

    if(!videos.length){
        renderEmpty("No videos found");
        return;
    }

    results.innerHTML = videos.map(video => {

        const title = escapeHtml(
            video.snippet.title
        );

        const channel = escapeHtml(
            video.snippet.channelTitle
        );

        const thumb =
            video.snippet.thumbnails.medium.url;

        return `
            <article
                class="video-card"
                data-video-id="${video.id.videoId}"
            >

                <img
                    class="video-thumb"
                    src="${thumb}"
                    alt="${title}"
                >

                <div class="video-body">

                    <h3>${title}</h3>

                    <p>${channel}</p>

                </div>

            </article>
        `;
    }).join("");

    document
        .querySelectorAll(".video-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {
                    openVideoModal(
                        card.dataset.videoId
                    );
                }
            );

        });
}

async function runSearch(query){

    if(!query.trim()){
        return;
    }

    setStatus(`Searching "${query}"...`);

    try{

        const videos =
            await searchVideos(query);

        renderVideos(videos);

        setStatus(
            `${videos.length} videos found`
        );

    }catch(error){

        setStatus(error.message);

    }
}

function openVideoModal(videoId){

    if(player){
        player.destroy();
    }

    document.getElementById("player").innerHTML = `
        <div
            data-plyr-provider="youtube"
            data-plyr-embed-id="${videoId}">
        </div>
    `;

    player = new Plyr(
        "#player div",
        {
            autoplay:true
        }
    );

    modal.classList.add("active");
}

function closeVideoModal(){

    modal.classList.remove("active");

    if(player){
        player.destroy();
        player = null;
    }
}

closeBtn.addEventListener(
    "click",
    closeVideoModal
);

modal.addEventListener("click",(e)=>{

    if(
        e.target.classList.contains(
            "modal-overlay"
        )
    ){
        closeVideoModal();
    }

});

form.addEventListener("submit",(e)=>{

    e.preventDefault();

    runSearch(
        input.value
    );

});

renderEmpty(
    "Search videos to see results."
);