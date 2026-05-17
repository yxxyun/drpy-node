/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '繁星四月[书]',
  author: 'Legado',
  '类型': '小说',
  lang: 'ds'
})
*/
var rule = {
  类型: '小说',
  title: '繁星四月[书]',
  host: 'http://www.fuxsb.com/#Toshiko',
  url: '/fyclass/##fypage',
  searchUrl: '/e/search/index.php',
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
    let list = this.pdfa(html, '.list_article ul li') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, 'h2&&Text##\上.*|\中.*|\下.*|\番外.*');
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
      vod_name: this.pdfh(html, 'h1&&Text'),
      vod_pic: this.pdfh(html, 'img&&src'),
      vod_content: this.pdfh(html, '.co-by&&Html') || this.pdfh(html, '.book-content&&Html') || '',
      vod_actor: this.pdfh(html, '.atts strong&&Text||.ccfun strong&&Text')
    };
    // Chapter list
    let chapters = this.pdfa(html, '.co-chapter li a') || [];
    if (chapters.length === 0) {
      // Try to find TOC URL
      let tocUrl = this.pd(html, 'a[href*=index]&&href');
      if (tocUrl) {
        let tocHtml = await request(tocUrl);
        chapters = this.pdfa(tocHtml, '.co-chapter li a') || [];
      }
    }
    VOD.vod_play_from = '繁星四月';
    VOD.vod_play_url = chapters.map(c => {
      let title = this.pdfh(c, 'name');
      let url = this.pd(c, 'url');
      if (url && !url.startsWith('http')) url = this.host + url;
      return title + '$' + url;
    }).filter(Boolean).join('#');
    return VOD;
  },

  搜索: async function() {
    let html = await request(this.input);
    let list = this.pdfa(html, '.list_article ul li') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, 'h2&&Text##\上.*|\中.*|\下.*|\番外.*');
      if (title) {
        d.push({
          title: title,
          url: this.pd(item, 'a&&href') || '',
          pic_url: '',
          desc: this.pdfh(item, '.click&&Text') || ''
        });
      }
    });
    return setResult(d);
  },

  lazy: async function() {
    let { input, pdfh } = this;
    let html = await request(input);
    let content = pdfh(html, '.co-by&&Html') || '';
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