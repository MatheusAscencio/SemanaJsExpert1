class Network {

  constructor({ host }) {
    this.host = host;
  }

  parseManifestUrl({ url, hostTag, fileResolution, fileResolutionTag }) {
    return url.replace(fileResolutionTag, fileResolution).replace(hostTag, this.host);
  }

  async fetchFile(url) {
    const res = await fetch(url);
    return res.arrayBuffer();
  }
}