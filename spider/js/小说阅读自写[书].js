// NOTE: 此源使用APP登录方式，无法在drpyS中正常运行
/*
@header({
  searchable: 0,
  filterable: 0,
  quickSearch: 0,
  title: '小说阅读自写[书]',
  author: 'Legado',
  '类型': '小说',
  lang: 'ds'
})
*/
var rule = {
  类型: '小说',
  title: '小说阅读自写[书]',
  host: 'http://www.tykh.net/',
  url: '/fyclass/##fypage',
  searchUrl: '',
  searchable: 0,
  quickSearch: 1,
  filterable: 0,
  timeout: 10000,
  play_parse: true,
  headers: { 'User-Agent': 'MOBILE_UA' },
  class_name: '全部',
  class_url: 'all',
  
  一级: async function() {
    let html = await request(this.input);
    let list = this.pdfa(html, '.mian@a') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, 'title');
      if (title) {
        d.push({
          title: title,
          url: this.pd(item, 'a&&href') || '',
          pic_url: this.pd(item, 'img&&src') || ''
        });
      }
    });
    return setResult(d);
  },

  二级: async function() {
    let html = await request(this.input);
    let VOD = {
      vod_name: this.pdfh(html, '@get:{n}'),
      vod_pic: this.pdfh(html, '@get:{c}'),
      vod_content: this.pdfh(html, '@get:{i}'),
      vod_actor: this.pdfh(html, '@get:{a}')
    };
    // Chapter list
    let chapters = this.pdfa(html, '#chapterlsit@li@a') || [];
    if (chapters.length === 0) {
      // Try to find TOC URL
      let tocUrl = this.pd(html, 'a[href*=index]&&href');
      if (tocUrl) {
        let tocHtml = await request(tocUrl);
        chapters = this.pdfa(tocHtml, '#chapterlsit@li@a') || [];
      }
    }
    VOD.vod_play_from = '小说阅读自写';
    VOD.vod_play_url = chapters.map(c => {
      let title = this.pdfh(c, 'text');
      let url = this.pd(c, 'href');
      if (url && !url.startsWith('http')) url = this.host + url;
      return title + '$' + url;
    }).filter(Boolean).join('#');
    return VOD;
  },

  搜索: async function() {
    let html = await request(this.input);
    let list = this.pdfa(html, '.mian@a') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, 'title');
      if (title) {
        d.push({
          title: title,
          url: this.pd(item, 'a&&href') || '',
          pic_url: this.pd(item, 'img&&src') || '',
          desc: this.pdfh(item, '.mian-book .tishi&&Text') || ''
        });
      }
    });
    return setResult(d);
  },

  lazy: async function() {
    let { input, pdfh } = this;
    let html = await request(input);
    let content = pdfh(html, '#newsinfo&&Html') || '';
    if (content) {
      content = content
        .replace(/<script[^>]*?>.*?<\/script>/gs, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
    }
    return {
      parse: 0,
      url: `novel://${JSON.stringify({ title: pdfh(html, 'h1&&Text') || '', content })}`,
      js: ''
    };
  }
};