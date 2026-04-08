import React from "react";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import config from "../config/config";
export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-amber-50 text-gray-900">
      <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/80 border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              {config.appName}
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              to="/"
              className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="px-4 py-2 rounded-full text-sm font-medium text-orange-600 bg-orange-100"
            >
              About
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 transition-colors shadow-sm"
            >
              Signup
            </Link>
          </nav>
        </div>
      </header>

      <main className="min-h-screen flex items-center justify-center px-6 pt-16">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-orange-500">
            About {config.appName}
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            {config.appName} is a neighborhood support platform that helps
            residents connect with each other for daily assistance,
            volunteering, and local collaboration. Our goal is to make it easy
            for people to ask for help, offer skills, and build stronger, safer
            communities together.
          </p>
        </div>
      </main>
    </div>
  );
}
