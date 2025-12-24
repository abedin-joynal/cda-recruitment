const staticDevCoffee = "dev-coffee-site-v1";
const assets = [
  "/",
  "/Recruitment.html",
  "/js/operators/operators.js",
  "/js/operators/operators.js", 
  "/js/sb-admin-2.js", 
  "/js/notify.min.js", 
  "/js/jquery.auto-complete.js",

  "/vendor/fontawesome-free/css/all.min.css", 
  "/css/font-awesome-google-api.css", 
  "/css/sb-admin-2.css", 
  "/css/custom.css", 
  "/css/jquery.auto-complete.css", 

  "/vendor/jquery/jquery.min.js",
  "/vendor/bootstrap/js/bootstrap.bundle.min.js",

  "/vendor/jquery-easing/jquery.easing.min.js",


  "/js/moment.min.js",
  "/js/underscore.min.js",
  "/css/bootstrap-4.min.css">
  "/js/bootstrap-4.min.js",
  "/js/axios.min.js",

  "/js/main.js",

  "https://cdn.datatables.net/1.13.6/css/jquery.dataTables.css",
  "https://cdn.datatables.net/1.13.6/js/jquery.dataTables.js",

  "https://cdnjs.cloudflare.com/ajax/libs/cropper/2.3.3/cropper.css",
 
  "https://cdnjs.cloudflare.com/ajax/libs/cropper/2.3.3/cropper.js",
  "/js/operators/glfx.js",
  "/js/print.js",
];

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticDevCoffee).then(cache => {
      cache.addAll(assets);
    })
  );
});

self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return res || fetch(fetchEvent.request);
    })
  );
});
