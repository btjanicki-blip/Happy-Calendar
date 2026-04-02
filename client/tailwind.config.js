/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        skyPastel: "#8ECDF7",
        blushPastel: "#F7C8DA",
        cloud: "#F7FBFF",
        inkSoft: "#31455A",
        borderSoft: "#D9E7F2",
        success: "#9BE3B2",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(91, 134, 170, 0.12)",
      },
      backgroundImage: {
        "app-gradient":
          "radial-gradient(circle at top left, rgba(142, 205, 247, 0.38), transparent 32%), radial-gradient(circle at top right, rgba(247, 200, 218, 0.42), transparent 28%), linear-gradient(180deg, #FDFEFF 0%, #F1F8FF 100%)",
      },
    },
  },
  plugins: [],
};
