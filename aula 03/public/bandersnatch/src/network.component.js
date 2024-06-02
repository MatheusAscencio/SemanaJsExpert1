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

  async getProperResolution(url) {
    const startMs = Date.now();
    const response = await fetch(url);
    await response.arrayBuffer();
    const endMs = Date.now();
    const durationInMs = (endMs - startMs);
    console.log('durationInMs', durationInMs);

    // ao invés de calcular o throughPut vamos calcular a duração
    const resolutions = [
      { start: 3001, end: 20000, resolution: 144 },
      // até 3 seg
      { start: 901, end: 3000, resolution: 360 },
      // menos de 1 seg.
      { start: 0, end: 900, resolution: 720 }
    ]

    const item = resolutions.find(item => {
      return item.start <= durationInMs && item.end >= durationInMs
    })

    const LOWEST_RESOLUTION = 144;

    if (!item) return LOWEST_RESOLUTION;

    return item.resolution;
  }
}