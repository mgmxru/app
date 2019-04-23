async function deployDNSSEC(web3, accounts, ens) {
  console.log('***** DNSSEC', web3)
  const { sha3 } = web3.utils
  function deploy(contractJSON, ...args) {
    const contract = new web3.eth.Contract(contractJSON.abi)
    return contract
      .deploy({
        data: contractJSON.bytecode,
        arguments: args
      })
      .send({
        from: accounts[0],
        gas: 6700000
      })
  }

  function namehash(name) {
    let node =
      '0x0000000000000000000000000000000000000000000000000000000000000000'
    if (name !== '') {
      let labels = name.split('.')
      for (let i = labels.length - 1; i >= 0; i--) {
        node = sha3(node + sha3(labels[i]).slice(2), {
          encoding: 'hex'
        })
      }
    }
    return node.toString()
  }

  function loadContract(modName, contractName) {
    return require(`@ensdomains/${modName}/build/contracts/${contractName}`)
  }

  const RSASHA1Algorithm = loadContract("dnssec-oracle", "RSASHA1Algorithm");
  const RSASHA256Algorithm = loadContract("dnssec-oracle", "RSASHA256Algorithm");
  // const SHA1Digest = artifacts.require("./digests/SHA1Digest");
  // const SHA256Digest = artifacts.require("./digests/SHA256Digest");
  // const SHA1NSEC3Digest = artifacts.require("./nsec3digests/SHA1NSEC3Digest");
  // const DummyAlgorithm = artifacts.require("./algorithms/DummyAlgorithm");
  // const DummyDigest = artifacts.require("./digests/DummyDigest");
  const dnsAnchors = require("@ensdomains/dnssec-oracle/lib/anchors");
  // const anchors = dnsAnchors.realEntries;
  console.log(0)
  const DnsRegistrar = loadContract('dnsregistrar', 'DNSRegistrar')
  console.log(0.1)
  const DNSSEC = loadContract('dnssec-oracle', 'DNSSECImpl')
  console.log(1)
  /* Deploy the main contracts  */
  const dnssec = await deploy(DNSSEC, dnsAnchors.encode(anchors))
  console.log(2)
  const dnsRegistrar = await deploy(
    DnsRegistrar,
    ens._address,
    namehash('xyz')
  )
  console.log(3)
  const rsasha256 = await deploy(RSASHA256Algorithm);
  const rsasha1 = await deploy(RSASHA1Algorithm);
  const sha256digest = await deploy(SHA256Digest);
  const sha1digest = await deploy(SHA1Digest);
  const sha1nsec3digest = await deploy(SHA1NSEC3Digest);
  await dnssec.methods.setAlgorithm(5, rsasha1.address);
  await dnssec.methods.setAlgorithm(7, rsasha1.address);
  await dnssec.methods.setAlgorithm(8, rsasha256._address);
  await dnssec.methods.setDigest(1, sha1digest._address);
  await dnssec.methods.setDigest(2, sha256digest._address);
  await dnssec.methods.setNSEC3Digest(1, sha1nsec3digest._address);
  return { dnssec }
}
export default deployDNSSEC
