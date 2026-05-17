/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '追更人[书]',
  author: 'Legado',
  '类型': '小说',
  lang: 'ds'
})
*/
var rule = {
  类型: '小说',
  title: '追更人[书]',
  host: 'https://www.zhuigengren.com',
  url: '/fyclass/##fypage',
  searchUrl: '/search/',
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
    let list = this.pdfa(html, '.search-list ul li||.book-list ul li||.clearfix.1@li') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, 'a&&Text');
      if (title) {
        d.push({
          title: title,
          url: this.pd(item, 'a&&href') || '',
          pic_url: this.pd(item, 'mip-img&&src') || ''
        });
      }
    });
    return setResult(d);
  },

  二级: async function() {
    let html = await request(this.input);
    let VOD = {
      vod_name: this.pdfh(html, '[property$=book_name]&&content'),
      vod_pic: this.pdfh(html, '[property$=image]&&content'),
      vod_content: this.pdfh(html, '[property$=description]&&content'),
      vod_actor: this.pdfh(html, '[property$=author]&&content')
    };
    // Chapter list
    let chapters = this.pdfa(html, '.attentions ul a') || [];
    if (chapters.length === 0) {
      // Try to find TOC URL
      let tocUrl = this.pd(html, '.review-more@a&&href');
      if (tocUrl) {
        let tocHtml = await request(tocUrl);
        chapters = this.pdfa(tocHtml, '.attentions ul a') || [];
      }
    }
    VOD.vod_play_from = '追更人';
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
    let list = this.pdfa(html, '.search-list ul li||.book-list ul li||.clearfix.1@li') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, 'a&&Text');
      if (title) {
        d.push({
          title: title,
          url: this.pd(item, 'a&&href') || '',
          pic_url: this.pd(item, 'mip-img&&src') || '',
          desc: this.pdfh(item, '.info@span&&Text') || ''
        });
      }
    });
    return setResult(d);
  },

  lazy: async function() {
    let { input, pdfh } = this;
    let html = await request(input);
    let content = pdfh(html, '#articlecon@p&&Text') || '';
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