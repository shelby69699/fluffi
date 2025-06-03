
const BLOCKFROST_KEY = 'mainnetiT2DrrBlVvPSozkzPZ0ovE5uuJveWxJz';
const RECEIVER_ADDRESS = 'addr1q8y94q35y2xmh8jjqaqpgw5h6sygku6nx9umejtegykc6e87dfl0l0wv4ys46hssj6cg9h8j9m7esgag7ez6l0xwy3gspn4a84';

const connectBtn = document.getElementById("connectBtn");
const walletAddressDisplay = document.getElementById("walletAddress");
const stakeBtn = document.getElementById("stakeBtn");

function hexToBytes(hex) {
  return Uint8Array.from(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

async function getProtocolParams() {
  const response = await fetch('https://cardano-mainnet.blockfrost.io/api/v0/epochs/latest/parameters', {
    headers: { project_id: BLOCKFROST_KEY }
  });
  return await response.json();
}

connectBtn.onclick = async () => {
  if (!window.cardano || !window.cardano.eternl) {
    alert("Eternal Wallet not found.");
    return;
  }
  try {
    await window.cardano.eternl.enable();
    const api = await window.cardano.eternl.enable();
    const usedAddresses = await api.getUsedAddresses();
    const address = usedAddresses[0];
    walletAddressDisplay.textContent = "Wallet: " + address;
  } catch (err) {
    console.error(err);
    alert("Failed to connect to wallet.");
  }
};

stakeBtn.onclick = async () => {
  try {
    const amountADA = parseFloat(document.getElementById("amount").value);
    if (isNaN(amountADA) || amountADA <= 0) {
      alert("Enter a valid ADA amount.");
      return;
    }

    const api = await window.cardano.eternl.enable();
    const csl = CardanoSerializationLib;

    // Fetch UTXOs
    const utxosHex = await api.getUtxos();
    if (!utxosHex.length) {
      alert("No UTXOs available in wallet.");
      return;
    }
    const utxos = utxosHex.map(u => csl.TransactionUnspentOutput.from_bytes(hexToBytes(u)));

    // Fetch protocol parameters
    const protocolParams = await getProtocolParams();
    const linearFee = csl.LinearFee.new(
      csl.BigNum.from_str(protocolParams.min_fee_a.toString()),
      csl.BigNum.from_str(protocolParams.min_fee_b.toString())
    );
    const coinsPerUtxoWord = csl.BigNum.from_str(protocolParams.coins_per_utxo_word.toString());

    const txBuilderCfg = csl.TransactionBuilderConfigBuilder.new()
      .fee_algo(linearFee)
      .coins_per_utxo_word(coinsPerUtxoWord)
      .pool_deposit(csl.BigNum.from_str('0'))
      .key_deposit(csl.BigNum.from_str('0'))
      .max_value_size(5000)
      .max_tx_size(16384)
      .prefer_pure_change(true)
      .build();

    const txBuilder = csl.TransactionBuilder.new(txBuilderCfg);

    // Add inputs
    utxos.forEach(utxo => {
      const input = utxo.input();
      const output = utxo.output();
      txBuilder.add_input(output.address(), input, output.amount());
    });

    // Add output
    const adaAmount = csl.BigNum.from_str((amountADA * 1000000).toString());
    const txOutput = csl.TransactionOutput.new(
      csl.Address.from_bech32(RECEIVER_ADDRESS),
      csl.Value.new(adaAmount)
    );
    txBuilder.add_output(txOutput);

    // Set change to first wallet address
    const changeAddress = csl.Address.from_bech32((await api.getUsedAddresses())[0]);
    txBuilder.add_change_if_needed(changeAddress);

    // Build, sign, and submit
    const txBody = txBuilder.build();
    const tx = csl.Transaction.new(txBody, csl.TransactionWitnessSet.new());
    const txHex = Buffer.from(tx.to_bytes()).toString('hex');
    const signedTxHex = await api.signTx(txHex, true);
    const txHash = await api.submitTx(signedTxHex);

    alert("Transaction submitted! Hash: " + txHash);
  } catch (err) {
    console.error(err);
    alert("Staking failed: " + err.message);
  }
};
