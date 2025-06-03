async function connectEternalWallet() {
  const statusText = document.getElementById("walletAddress");
  statusText.textContent = "🔄 Connecting...";

  if (!window.cardano || !window.cardano.eternl) {
    alert("❌ Eternal Wallet not found. Please install from eternalwallet.io.");
    return;
  }

  try {
    const api = await window.cardano.eternl.enable();
    if (!api.getUsedAddresses) throw new Error("Access rejected");

    const addresses = await api.getUsedAddresses();
    const firstAddress = addresses[0];

    statusText.textContent = "✅ Connected: " + firstAddress.slice(0, 8) + "...";
    window.eternlApi = api;
    document.getElementById("stakeBtn").disabled = false;
  } catch (err) {
    console.error("Wallet connect failed:", err);
    statusText.textContent = "❌ Failed to connect.";
    alert("Failed to connect to Eternal Wallet. Please ensure it's unlocked and you approved the prompt.");
  }
}

document.getElementById("connectBtn").addEventListener("click", connectEternalWallet); 