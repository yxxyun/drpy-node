/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '错层小说网[书]',
  author: 'Legado',
  '类型': '小说',
  lang: 'ds'
})
*/
var rule = {
  类型: '小说',
  title: '错层小说网[书]',
  host: 'https://www.cuoceng.com',
  url: '/fyclass/##fypage',
  searchUrl: '/book/search.html?pageNo=1&kw=**&sortBy=hits',
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
    let list = this.pdfa(html, '$.content[*]') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, '$.bkName');
      if (title) {
        d.push({
          title: title,
          url: this.pd(item, 'a&&href') || '',
          pic_url: this.pd(item, '$.bkCover') || ''
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
      vod_content: this.pdfh(html, '.intro&&Text'),
      vod_actor: this.pdfh(html, '')
    };
    // Chapter list
    let chapters = this.pdfa(html, '.dirList li a') || [];
    if (chapters.length === 0) {
      // Try to find TOC URL
      let tocUrl = this.pd(html, 'a[href*=index]&&href');
      if (tocUrl) {
        let tocHtml = await request(tocUrl);
        chapters = this.pdfa(tocHtml, '.dirList li a') || [];
      }
    }
    VOD.vod_play_from = '错层小说网';
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
    let list = this.pdfa(html, '$.content[*]') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, '$.bkName');
      if (title) {
        d.push({
          title: title,
          url: this.pd(item, 'a&&href') || '',
          pic_url: this.pd(item, '$.bkCover') || '',
          desc: this.pdfh(item, '$.authName') || ''
        });
      }
    });
    return setResult(d);
  },

  lazy: async function() {
    let { input, pdfh } = this;
    let html = await request(input);
    let content = pdfh(html, '.readBox&&Html') || '';
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