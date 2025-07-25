import React, { useState } from "react";
import "./Layout.css";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className={`layout ${darkMode ? "dark" : "light"}`}>
      <header className="layout-header">
        <div className="layout-title">🏦 PocketBank</div>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "🌞 Aydınlık Mod" : "🌙 Karanlık Mod"}
        </button>
      </header>

      <main className="layout-content">{children}</main>
    </div>
  );
};

export default Layout;
