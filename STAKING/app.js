
const BLOCKFROST_KEY = 'mainnetiT2DrrBlVvPSozkzPZ0ovE5uuJveWxJz';
const RECEIVER_ADDRESS = 'addr1q8y94q35y2xmh8jjqaqpgw5h6sygku6nx9umejtegykc6e87dfl0l0wv4ys46hssj6cg9h8j9m7esgag7ez6l0xwy3gspn4a84';

document.getElementById("connectBtn").onclick = async () => {
  if (!window.cardano || !window.cardano.eternl) {
    alert("Eternal Wallet not found.");
    return;
  }

  try {
    await window.cardano.eternl.enable();
    const api = await window.cardano.eternl.enable();
    const usedAddresses = await api.getUsedAddresses();
    const address = usedAddresses[0];
    document.getElementById("walletAddress").textContent = "Wallet: " + address;
  } catch (err) {
    console.error(err);
    alert("Failed to connect to wallet.");
  }
};

document.getElementById("stakeBtn").onclick = async () => {
  const amountInput = document.getElementById("amount").value;
  const amountADA = parseFloat(amountInput);
  if (isNaN(amountADA) || amountADA <= 0) {
    alert("Enter a valid ADA amount.");
    return;
  }

  try {
    const api = await window.cardano.eternl.enable();
    const csl = window.cardano_serialization_lib;
    const utxosHex = await api.getUtxos();
    const utxos = utxosHex.map(u => csl.TransactionUnspentOutput.from_bytes(Buffer.from(u, 'hex')));
    const txBuilderCfg = csl.TransactionBuilderConfigBuilder.new()
      .fee_algo(csl.LinearFee.new(csl.BigNum.from_str("44"), csl.BigNum.from_str("155381")))
      .coins_per_utxo_word(csl.BigNum.from_str("34482"))
      .pool_deposit(csl.BigNum.from_str("500000000"))
      .key_deposit(csl.BigNum.from_str("2000000"))
      .max_value_size(5000)
      .max_tx_size(16384)
      .prefer_pure_change(true)
      .build();

    const txBuilder = csl.TransactionBuilder.new(txBuilderCfg);

    for (let utxo of utxos) txBuilder.add_input(utxo.output().address(), utxo.input(), utxo.output().amount());

    const output = csl.TransactionOutput.new(
      csl.Address.from_bech32(RECEIVER_ADDRESS),
      csl.Value.new(csl.BigNum.from_str((amountADA * 1000000).toString()))
    );
    txBuilder.add_output(output);
    txBuilder.add_change_if_needed(csl.Address.from_bech32(RECEIVER_ADDRESS));

    const txBody = txBuilder.build();
    const tx = csl.Transaction.new(txBody, csl.TransactionWitnessSet.new());

    const signedTxHex = await api.signTx(Buffer.from(tx.to_bytes()).toString('hex'), true);
    const txHash = await api.submitTx(signedTxHex);

    alert("Transaction submitted! Hash: " + txHash);
  } catch (err) {
    console.error(err);
    alert("Transaction failed: " + err.message);
  }
};
