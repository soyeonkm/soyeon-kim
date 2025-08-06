#!/bin/bash

# GitHub Repository Setup Script
# This script helps you set up your portfolio website as a GitHub repository

echo "🚀 Setting up GitHub repository for your portfolio website..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Initialize git repository
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
else
    echo "✅ Git repository already exists"
fi

# Add all files
echo "📝 Adding files to Git..."
git add .

# Make initial commit
echo "💾 Making initial commit..."
git commit -m "Initial commit: Portfolio website template

- Modern responsive design with dark theme
- Interactive sections: Hero, About, Projects, Skills, Experience, Contact
- Mobile-friendly navigation
- Smooth animations and hover effects
- Contact form with validation
- Accessibility features
- Cross-browser compatibility"

echo ""
echo "✅ Repository setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new repository on GitHub:"
echo "   - Go to https://github.com/new"
echo "   - Name it 'software-engineer-portfolio' or your preferred name"
echo "   - Make it public or private"
echo "   - Don't initialize with README (we already have one)"
echo ""
echo "2. Connect your local repository to GitHub:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Enable GitHub Pages:"
echo "   - Go to your repository Settings"
echo "   - Scroll down to 'Pages' section"
echo "   - Select 'Deploy from a branch'"
echo "   - Choose 'main' branch and '/ (root)' folder"
echo "   - Save to enable automatic deployment"
echo ""
echo "4. Customize your portfolio:"
echo "   - Update personal information in index.html"
echo "   - Replace placeholder images with your photos"
echo "   - Add your actual projects and links"
echo "   - Update contact information"
echo ""
echo "🎉 Your portfolio will be live at: https://YOUR_USERNAME.github.io/YOUR_REPO_NAME" 