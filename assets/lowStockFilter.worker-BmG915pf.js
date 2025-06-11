(function(){"use strict";self.onmessage=s=>{const{products:t,threshold:e}=s.data,o=t.filter(c=>c.quantity<e);self.postMessage({lowStock:o})}})();
