/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '笔趣阁77[书]',
  author: 'Legado',
  '类型': '小说',
  lang: 'ds'
})
*/
var rule = {
  类型: '小说',
  title: '笔趣阁77[书]',
  host: 'http://www.biquge77.net',
  url: '/fyclass/##fypage',
  searchUrl: '{{source.getKey().match(/([^\#]+)\#/)[1]}}/search/',
  searchable: 1,
  quickSearch: 1,
  filterable: 0,
  timeout: 10000,
  play_parse: true,
  headers: { 'User-Agent': 'MOBILE_UA' },
  class_name: '全部',
  class_url: 'all',
  
  一级: async function() {
    let html = await request(this.input);
    let list = this.pdfa(html, '.container ul@li!0') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, '.s2 a&&Text');
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
      vod_name: this.pdfh(html, '[property$=book_name]&&content'),
      vod_pic: this.pdfh(html, '.container@img&&src'),
      vod_content: this.pdfh(html, '.desc xs-hidden&&Html'),
      vod_actor: this.pdfh(html, '[property$=author]&&content')
    };
    // Chapter list
    let chapters = this.pdfa(html, 'ul.-1@li') || [];
    if (chapters.length === 0) {
      // Try to find TOC URL
      let tocUrl = this.pd(html, 'a[href*=index]&&href');
      if (tocUrl) {
        let tocHtml = await request(tocUrl);
        chapters = this.pdfa(tocHtml, 'ul.-1@li') || [];
      }
    }
    VOD.vod_play_from = '笔趣阁77';
    VOD.vod_play_url = chapters.map(c => {
      let title = this.pdfh(c, 'a&&Text');
      let url = this.pd(c, 'a&&href');
      if (url && !url.startsWith('http')) url = this.host + url;
      return title + '$' + url;
    }).filter(Boolean).join('#');
    return VOD;
  },

  搜索: async function() {
    let html = await request(this.input);
    let list = this.pdfa(html, '.container ul@li!0') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, '.s2 a&&Text');
      if (title) {
        d.push({
          title: title,
          url: this.pd(item, 'a&&href') || '',
          pic_url: '',
          desc: this.pdfh(item, '.s4&&Text') || ''
        });
      }
    });
    return setResult(d);
  },

  lazy: async function() {
    let { input, pdfh } = this;
    let html = await request(input);
    let content = pdfh(html, '#content&&Html') || '';
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