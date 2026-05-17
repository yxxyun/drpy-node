/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 1,
  title: 'NTRseqing小说[书]',
  author: 'Legado',
  '类型': '小说',
  lang: 'ds'
})
*/
var rule = {
  类型: '小说',
  title: 'NTRseqing小说[书]',
  host: 'https://www.aahhss.com/',
  url: '/fyclass/##fypage',
  searchUrl: 'https://www.aakkrr.com/book/**/1',
  searchable: 1,
  quickSearch: 1,
  filterable: 0,
  timeout: 10000,
  play_parse: true,
  headers: { 'User-Agent': 'MOBILE_UA' },
  class_name: '都市激情&家庭乱伦&校园春色&东方玄幻&穿越重生&同人改编&系统异能&历史架空&经典武侠&乡村爱情&科学幻想&娱乐明星&人妻&后宫&熟女&爽文&调教&NTR&猎艳&淫堕&剧情&母子&性奴&凌辱&重口&人兽&异种族&SM&暴虐&强奸&淫堕&爽文&性奴&手枪文&痴女&肉便器&异国&NTL&露出&凌辱&骨科&虐主&NP&道具&微重口&甜文&催眠&官场&重口&淫妻&父女&灵异&异种族&萝莉&姐妹花&恋足&恋足&恋足&无绿&浪漫&小马拉大车&交换伴侣&受孕&目前犯&暗黑&足交&榨精&媚黑&百合&公媳&全家桶&种马&快穿&虐心&末世&复仇&性转&药物&HE&监禁&产奶&破处&逆推&伪娘&微肉&56&狗血&耽美&改造&隐奸&捆绑&SC&粗口&触手&人妖&扩张&神豪&病娇&种田&变装&搞笑&BE&暴露&群P&老师&同人&人气排行&收藏排行&热门全本&肉量排行&评分排行&最新小说',
  class_url: 'category&category&category&category&category&category&category&category&category&category&category&category&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&tag&top&top&top&top&top&top',
  
  一级: async function() {
    let html = await request(this.input);
    let list = this.pdfa(html, '.grid-item') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, 'h3 a&&Text');
      if (title) {
        d.push({
          title: title,
          url: this.pd(item, 'a&&href') || '',
          pic_url: this.pd(item, 'img&&src##http.*file##https://static.aahhss.com/file') || ''
        });
      }
    });
    return setResult(d);
  },

  二级: async function() {
    let html = await request(this.input);
    let VOD = {
      vod_name: this.pdfh(html, '.txt@h1&&Text'),
      vod_pic: this.pdfh(html, '[property="og:image"]&&content'),
      vod_content: this.pdfh(html, '.book-desc&&Text'),
      vod_actor: this.pdfh(html, '.authors@dd&&Text')
    };
    // Chapter list
    let chapters = this.pdfa(html, '.book-chapter@a') || [];
    if (chapters.length === 0) {
      // Try to find TOC URL
      let tocUrl = this.pd(html, 'a[href*=index]&&href');
      if (tocUrl) {
        let tocHtml = await request(tocUrl);
        chapters = this.pdfa(tocHtml, '.book-chapter@a') || [];
      }
    }
    VOD.vod_play_from = 'NTRseqing小说';
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
    let list = this.pdfa(html, '.grid-item') || [];
    let d = [];
    list.forEach(item => {
      let title = this.pdfh(item, 'h3 a&&Text');
      if (title) {
        d.push({
          title: title,
          url: this.pd(item, 'a&&href') || '',
          pic_url: this.pd(item, 'img&&src##http.*file##https://static.aahhss.com/file') || '',
          desc: ''
        });
      }
    });
    return setResult(d);
  },

  lazy: async function() {
    let { input, pdfh } = this;
    let html = await request(input);
    let content = pdfh(html, '#content@p&&Text') || '';
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