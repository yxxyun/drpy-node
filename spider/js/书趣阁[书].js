/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '书趣阁[书]',
  author: 'Legado',
  '类型': '小说',
  lang: 'ds'
})
*/
var rule = {
  类型: '小说',
  title: '书趣阁[书]',
  host: 'https://m.22shuqu.com/',
  url: '/fyclass/##fypage',
  searchUrl: '{{url=source.getKey();cookie.removeCookie(url)}}/ss/',
  searchable: 1,
  quickSearch: 1,
  filterable: 0,
  timeout: 10000,
  play_parse: true,
  headers: { 'User-Agent': 'MOBILE_UA' },
  class_name: '玄幻&武侠&都市&历史&科幻&游戏&女生&精品',
  class_url: 'class&class&class&class&class&class&class&class',
  
  一级: async function() {
    let html = await request(this.input);
    let list = this.pdfa(html, '.block') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, 'a.2&&Text');
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
      vod_name: this.pdfh(html, 'n'),
      vod_pic: this.pdfh(html, 'c'),
      vod_content: this.pdfh(html, 'i'),
      vod_actor: this.pdfh(html, 'a')
    };
    // Chapter list
    let chapters = this.pdfa(html, '.cover li a') || [];
    if (chapters.length === 0) {
      // Try to find TOC URL
      let tocUrl = this.pd(html, 't');
      if (tocUrl) {
        let tocHtml = await request(tocUrl);
        chapters = this.pdfa(tocHtml, '.cover li a') || [];
      }
    }
    VOD.vod_play_from = '书趣阁';
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
    let list = this.pdfa(html, '.block') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, 'a.2&&Text');
      if (title) {
        d.push({
          title: title,
          url: this.pd(item, 'a&&href') || '',
          pic_url: this.pd(item, 'img&&src') || '',
          desc: this.pdfh(item, 'p.2&&Text') || ''
        });
      }
    });
    return setResult(d);
  },

  lazy: async function() {
    let { input, pdfh } = this;
    let html = await request(input);
    let content = pdfh(html, '#nr1 p&&Text') || '';
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