/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: '污趣阁[书]',
  author: 'Legado',
  '类型': '小说',
  lang: 'ds'
})
*/
var rule = {
  类型: '小说',
  title: '污趣阁[书]',
  host: 'http://www.wuquge.com',
  url: '/fyclass/##fypage',
  searchUrl: 'http://www.wuquge.com/search/result.html?searchkey=**',
  searchable: 1,
  quickSearch: 1,
  filterable: 0,
  timeout: 10000,
  play_parse: true,
  headers: { 'User-Agent': 'MOBILE_UA' },
  class_name: '玄幻&修真&都市&历史&网游&科幻&悬疑&同人&轻小说&女生&短篇&其他&总点击榜&月点击榜&周点击榜&日点击榜&推荐数榜&收藏数榜&下载数榜&评论数榜&评分榜&最新入库',
  class_url: 'category&category&category&category&category&category&category&category&category&category&category&category&top&top&top&top&top&top&top&top&top&top',
  
  一级: async function() {
    let html = await request(this.input);
    let list = this.pdfa(html, 'li') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, '.novelname&&Text');
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
      vod_pic: this.pdfh(html, '.novelinfo-r > img&&src'),
      vod_content: this.pdfh(html, 'p&&Text'),
      vod_actor: this.pdfh(html, '.novelinfo-l li:nth-child(1) > a&&Text')
    };
    // Chapter list
    let chapters = this.pdfa(html, '.dirlist > li') || [];
    if (chapters.length === 0) {
      // Try to find TOC URL
      let tocUrl = this.pd(html, '.dirlist&&href');
      if (tocUrl) {
        let tocHtml = await request(tocUrl);
        chapters = this.pdfa(tocHtml, '.dirlist > li') || [];
      }
    }
    VOD.vod_play_from = '污趣阁';
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
    let list = this.pdfa(html, 'li') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, '.novelname&&Text');
      if (title) {
        d.push({
          title: title,
          url: this.pd(item, 'a&&href') || '',
          pic_url: this.pd(item, 'img&&src') || '',
          desc: this.pdfh(item, 'span:nth-child(2) > a&&Text') || ''
        });
      }
    });
    return setResult(d);
  },

  lazy: async function() {
    let { input, pdfh } = this;
    let html = await request(input);
    let content = pdfh(html, 'p&&Text') || '';
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