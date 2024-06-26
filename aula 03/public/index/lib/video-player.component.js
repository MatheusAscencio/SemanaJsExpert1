class VideoMediaPlayer {

  constructor({ manifestJSON, network, videoComponent }) {
    this.manifestJSON = manifestJSON;
    this.videoElement = null;
    this.sourceBuffer = null;
    this.network = network;
    this.videoComponent = videoComponent;
    this.activeItem = {}
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
      return;
    }

    const mediaSource = new MediaSource();
    this.videoElement.src = URL.createObjectURL(mediaSource);
    mediaSource.addEventListener('sourceopen', this.sourceOpenWrapper(mediaSource));
  }

  sourceOpenWrapper(mediaSource) {
    return async(_) => {
      // console.log('carregou!');
      this.sourceBuffer = mediaSource.addSourceBuffer(this.manifestJSON.codec);
      const selected = this.selected = this.manifestJSON.intro;
      mediaSource.duration = this.videoDuration;
      await this.fileDownload(selected.url);
      setInterval(this.waitForQuestions.bind(this), 200);
    }
  }

  waitForQuestions() {
    const currentTime = parseInt(this.videoElement.currentTime)
    const option = this.selected.at === currentTime;
    if (!option) return;

    // evita que o modal  seja aberto 2x no mesmo segundo
    if (this.activeItem.url === this.selected.url) return; 
    this.videoComponent.configureModal(this.selected.options);
    this.activeItem = this.selected;
  }

  async nextChunk(data) {
    const key = data.toLowerCase();
    const selected = this.manifestJSON[key];
    this.selected = {
      ...selected,
      // ajusta o tempo que o modal vai aparecer, baseado no tempo corrente
      at: parseInt(this.videoElement.currentTime + selected.at)
    }
    // deixa o restante do video rodar, enquanto o novo está sendo baixado.
    this.videoElement.play();
    await this.fileDownload(selected.url);
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
    this.videoDuration += parseFloat(videoDuration);
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