class VideoMediaPlayer {

  constructor({ manifestJSON, network}) {
    this.manifestJSON = manifestJSON;
    this.videoElement = null;
    this.sourceBuffer = null;
    this.network = network;
    this.selected = {}
    this.videoDuration = 0;
  }

  initializeCodec() {
    this.videoElement = document.getElementById('vid');
    const mediaSourceSupported = !!window.MediaSource;

    if (!mediaSourceSupported) {
      alert('Seu browser ou sistema não suportam a MSE.');
      return;
    }

    const codecSupported = MediaSource.isTypeSupported(this.manifestJSON.codec);
    if (!codecSupported) {
      alert(`Seu browser não suporta o codec: ${ this.manifestJSON.codec }`);
    }

    const mediaSource = new MediaSource();
    this.videoElement.src = URL.createObjectURL(mediaSource);
    mediaSource.addEventListener("sourceopen", );
  }

  sourceOpenWrapper(mediaSource) {
    return async(_) => {
      // console.log('carregou!');
      this.sourceBuffer = mediaSource.addSourceBuffer(this.manifestJSON.codec);
      const selected = this.selected = this.manifestJSON.intro;
      mediaSource.duration = this.videoDuration;
      await this.fileDownload(selected.url);
    }
  }

  async fileDownload(url) {
    const prepareUrl = {
      url,
      fileResolution: 360,
      fileResolutionTag: this.manifestJSON.fileResolutionTag,
      hostTag: this.manifestJSON.hostTag 
    }

    const finalUrl = this.network.parseManifestUrl(prepareUrl);
    this.setVideoPlayerDuration(finalUrl);
    const data = await this.network.fetchFile(finalUrl);
    return this.processBufferSegments();
  }

  setVideoPlayerDuration(finalUrl) {
    const bars = finalUrl.split('/');
    const [name, videoDuration] = bars[bars.length -1].split('-');
    this.videoDuration += videoDuration;
  }

  async processBufferSegments(allSegments) {
    const sourceBuffer = this.sourceBuffer
    sourceBuffer.appendBuffer(allSegments);

    return new Promise((res, rej) => {
      const updateEnd = (_) => {
        sourceBuffer.removeEventListener('updateend', updateEnd);
        sourceBuffer.timestampOffset = this.videoDuration;

        return res();
      }

      sourceBuffer.addEventListener('updateend', updateEnd);
      sourceBuffer.addEventListener('error', rej)
    });
  }

}