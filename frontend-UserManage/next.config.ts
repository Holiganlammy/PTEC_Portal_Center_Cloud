/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ["vpnptec.dyndns.org", "10.15.100.227", "img5.pic.in.th", "img4.pic.in.th", "img3.pic.in.th", "img2.pic.in.th", "img1.pic.in.th", "img6.pic.in.th", "img7.pic.in.th", "img8.pic.in.th", "images.unsplash.com","nac.purethai.co.th", "localhost"],
  },
}

module.exports = nextConfig