document.addEventListener("DOMContentLoaded", async () => {
	const urlParams = new URLSearchParams(window.location.search);
	const cardId = urlParams.get("id");
	if (!cardId) return;

	try {
		const { card } = await apiRequest(`/cards/${cardId}`);

		document.getElementById("card-image").src = card.images.large;
		document.getElementById("card-name").textContent = card.name;
		document.getElementById("card-hp").textContent = card.hp || "N/A";
		document.getElementById("card-types").textContent = card.types?.join(", ") || "N/A";
		document.getElementById("card-supertype").textContent = card.supertype;
		document.getElementById("card-subtypes").textContent = card.subtypes?.join(", ") || "N/A";
		document.getElementById("card-rarity").textContent = card.rarity || "N/A";
		document.getElementById("card-number").textContent = `${card.number || "?"}/${card.set.printedTotal || "?"}`;

		const set = card.set || {};
		document.getElementById("set-name").textContent = set.name || "N/A";
		document.getElementById("set-series").textContent = set.series || "N/A";
		document.getElementById("set-release-date").textContent = set.releaseDate || "N/A";

		// Market prices placeholder (expand later)
		const market = card.tcgplayer?.prices || {};
		const marketHtml = Object.entries(market).map(([rarity, data]) => {
			return `<p><strong>${rarity}:</strong> $${data.market.toFixed(2)}</p>`;
		}).join("");
		document.getElementById("market-data").innerHTML = marketHtml;

	} catch (err) {
		console.error("Failed to fetch card:", err);
	}
});
