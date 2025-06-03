
const connectBtn = document.getElementById("connectBtn");
const walletAddressDisplay = document.getElementById("walletAddress");
const stakeBtn = document.getElementById("stakeBtn");

connectBtn.onclick = async () => {
  walletAddressDisplay.textContent = "Connecting...";

  if (!window.cardano || !window.cardano.eternl) {
    alert("❌ Eternal Wallet not found. Please install it from eternalwallet.io.");
    return;
  }

  try {
    const api = await window.cardano.eternl.enable();
    const addresses = await api.getUsedAddresses();
    const firstAddress = addresses[0];
    walletAddressDisplay.textContent = "✅ Connected: " + firstAddress.slice(0, 10) + "...";
    window.eternlApi = api;
    stakeBtn.disabled = false;
  } catch (err) {
    console.error("Wallet connection error:", err);
    walletAddressDisplay.textContent = "❌ Connection failed.";
    alert("❌ Failed to connect to Eternal Wallet.\n\nPlease:\n1. Unlock Eternal\n2. Grant permission when prompted\n3. Try again");
  }
};

stakeBtn.onclick = () => {
  alert("This demo simulates staking. A real transaction builder comes next.");
};
