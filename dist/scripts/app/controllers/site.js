(function(){define(["jquery","providers/data","providers/template","text!templates/top_banner.tmpl.html","text!templates/copyright.tmpl.html"],function(e,t,n,r,i,s){var o;return o=function(){function s(){var n;this.banner=e("#top-banner"),this.brand=e("#brand"),this.copyright=e("#copyright"),this.settings||(n=this,t.getSettings().then(this.load.bind(this)).fail(function(e){throw e}))}return s.prototype.load=function(e){var t,n;return n=this,this.settings=e,t=e.site,document.title=""+t.title+"- "+t.brand,this.brand.html(t.brand),this.render(this.banner,{text:t.tagline},"top-banner",r),this.render(this.copyright,{text:t.copyright},"copyright",i)},s.prototype.render=function(e,t,r,i){var s;return s=n.render(t,"tmpl-"+r,i),e.html(s)},s}(),new o})}).call(this);