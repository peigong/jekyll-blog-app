(function(){define(["providers/data","controllers/nav","controllers/posts","controllers/post"],function(e,t,n,r){var i;return i=function(){function i(){}return i.prototype.show=function(e,i,s){return t.setCurrentNav(e,i),n.setCurrentList(e,i),n.getCurrentPostLink(i,s).then(function(t){return r.setLink(t,e)})},i.prototype.route=function(t,n,r){var i;return i=this,n||(n="default"),t?i.show(t,n,r):e.getCategories().then(function(e){if(e.length)return t=e[0].name,i.show(t,n,r)}).fail(function(e){throw e}),!1},i}(),new i})}).call(this);