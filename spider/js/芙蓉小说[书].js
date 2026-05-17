/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '芙蓉小说[书]',
  author: 'Legado',
  '类型': '小说',
  lang: 'ds'
})
*/
var rule = {
  类型: '小说',
  title: '芙蓉小说[书]',
  host: 'http://www.frtxt.com',
  url: '/fyclass/##fypage',
  searchUrl: '/search.php?keyword=**&submit=%CB%D1+%CB%F7',
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
    let list = this.pdfa(html, '.list table') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, '.name a&&Text');
      if (title) {
        d.push({
          title: title,
          url: this.pd(item, 'a&&href') || '',
          pic_url: this.pd(item, '.cover img&&src') || ''
        });
      }
    });
    return setResult(d);
  },

  二级: async function() {
    let html = await request(this.input);
    let VOD = {
      vod_name: this.pdfh(html, 'h1&&Text'),
      vod_pic: this.pdfh(html, '.booktable td:eq(0)&&src'),
      vod_content: this.pdfh(html, '.jianjie&&Text'),
      vod_actor: this.pdfh(html, '.booktable td:eq(3)&&Text')
    };
    // Chapter list
    let chapters = this.pdfa(html, '.list li') || [];
    if (chapters.length === 0) {
      // Try to find TOC URL
      let tocUrl = this.pd(html, 'a[href*=index]&&href');
      if (tocUrl) {
        let tocHtml = await request(tocUrl);
        chapters = this.pdfa(tocHtml, '.list li') || [];
      }
    }
    VOD.vod_play_from = '芙蓉小说';
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
    let list = this.pdfa(html, '.list table') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, '.name a&&Text');
      if (title) {
        d.push({
          title: title,
          url: this.pd(item, 'a&&href') || '',
          pic_url: this.pd(item, '.cover img&&src') || '',
          desc: ''
        });
      }
    });
    return setResult(d);
  },

  lazy: async function() {
    let { input, pdfh } = this;
    let html = await request(input);
    let content = pdfh(html, '.chapter&&Text') || '';
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