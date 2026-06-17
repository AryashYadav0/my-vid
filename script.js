const form = document.getElementById('searchForm');
const input = document.getElementById('searchInput');
const results = document.getElementById('results');
const statusText = document.getElementById('status');

const API_KEY = config?.YOUTUBE_API_KEY;

function setStatus(message) {
	statusText.textContent = message;
}

function escapeHtml(value) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function renderEmpty(message) {
	results.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function renderVideos(videos) {
	if (!videos.length) {
		renderEmpty('No videos found. Try a different search term.');
		return;
	}

	results.innerHTML = videos.map((video) => {
		const title = escapeHtml(video.snippet.title);
		const channel = escapeHtml(video.snippet.channelTitle);
		const description = escapeHtml(video.snippet.description || 'No description available.');
		const thumb = video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url || '';
		const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;

		return `
			<article class="video-card">
				<img class="video-thumb" src="${thumb}" alt="${title}">
				<div class="video-body">
					<h3>${title}</h3>
					<p>${channel}</p>
					<p>${description}</p>
					<a class="video-link" href="${videoUrl}" target="_blank" rel="noreferrer">Watch video</a>
				</div>
			</article>
		`;
	}).join('');
}

async function searchVideos(query) {
	if (!API_KEY) {
		throw new Error('YouTube API key is missing in config.js.');
	}

	const url = new URL('https://www.googleapis.com/youtube/v3/search');
	url.searchParams.set('part', 'snippet');
	url.searchParams.set('type', 'video');
	url.searchParams.set('maxResults', '10');
	url.searchParams.set('q', query);
	url.searchParams.set('key', API_KEY);

	const response = await fetch(url.toString());
	const data = await response.json();

	if (!response.ok) {
		const apiMessage = data?.error?.message || 'Request failed.';
		throw new Error(apiMessage);
	}

	return data.items || [];
}

async function runSearch(query) {
	const trimmedQuery = query.trim();

	if (!trimmedQuery) {
		setStatus('Please enter a search term.');
		renderEmpty('Search bar me koi keyword likho, phir Search button dabao.');
		return;
	}

	setStatus(`Searching for "${trimmedQuery}"...`);
	renderEmpty('Loading results...');

	try {
		const videos = await searchVideos(trimmedQuery);
		setStatus(`Showing top ${videos.length} results for "${trimmedQuery}".`);
		renderVideos(videos);
	} catch (error) {
		setStatus(`API error: ${error.message}`);
		renderEmpty('API test failed. Check your key, YouTube Data API v3, and API restrictions.');
	}
}

form.addEventListener('submit', (event) => {
	event.preventDefault();
	runSearch(input.value);
});

renderEmpty('Search results will appear here.');
