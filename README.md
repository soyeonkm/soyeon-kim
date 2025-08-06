# Soyeon Kim Portfolio Website

## 🚀 Features

### Design & Layout

- **Modern Dark Theme**: Clean, professional dark color scheme with cyan/teal accents
- **Responsive Design**: Fully responsive across all devices (desktop, tablet, mobile)
- **Developer-Friendly**: Code-like syntax highlighting and monospace fonts
- **Smooth Animations**: Subtle animations and hover effects
- **Accessibility**: Keyboard navigation and screen reader support

### Sections Included

1. **Hero Section**: Eye-catching introduction with animated code window
2. **About Me**: Professional photo placeholder, bio, and statistics
3. **Projects**: Featured projects with tech stack and links
4. **Skills & Technologies**: Organized by category with icons
5. **Work Experience**: Timeline layout with company details
6. **Contact**: Contact form and social media links
7. **Footer**: Minimalist footer with navigation

### Interactive Features

- **Mobile Navigation**: Hamburger menu for mobile devices
- **Smooth Scrolling**: Animated navigation between sections
- **Active Navigation**: Highlights current section in navigation
- **Contact Form**: Functional form with validation
- **Notification System**: Success/error messages
- **Hover Effects**: Interactive elements with smooth transitions
- **Loading Animations**: Progressive content reveal

## 🛠️ Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript**: Vanilla JS for interactivity
- **Font Awesome**: Icons for skills and social links
- **Google Fonts**: Inter (sans-serif) and JetBrains Mono (monospace)

## 📁 File Structure

```
portfolio/
├── index.html                    # Main HTML file
├── styles.css                    # CSS styles
├── script.js                     # JavaScript functionality
├── README.md                     # Documentation
├── LICENSE                       # MIT License
├── CONTRIBUTING.md               # Contributing guidelines
├── package.json                  # Project metadata
├── .gitignore                    # Git ignore rules
├── setup-github.sh              # GitHub setup script
├── .github/
│   ├── workflows/
│   │   └── deploy.yml           # GitHub Actions deployment
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md        # Bug report template
│   │   └── feature_request.md   # Feature request template
│   └── pull_request_template.md # PR template
└── .github/                     # GitHub specific files
```

## 🎨 Customization Guide

### Colors

The color scheme is defined in CSS custom properties (variables) in `styles.css`:

```css
:root {
  --bg-primary: #0a0a0a; /* Main background */
  --bg-secondary: #1a1a1a; /* Secondary background */
  --bg-tertiary: #2a2a2a; /* Tertiary background */
  --text-primary: #ffffff; /* Primary text */
  --text-secondary: #b3b3b3; /* Secondary text */
  --accent-primary: #00d4ff; /* Primary accent (cyan) */
  --accent-secondary: #ff6b6b; /* Secondary accent (red) */
  --accent-tertiary: #4ecdc4; /* Tertiary accent (teal) */
}
```

### Personal Information

Update the following sections in `index.html`:

1. **Hero Section**:

   ```html
   <span class="name">Your Name</span>
   <span class="title">Software Engineer</span>
   ```

2. **About Section**:

   - Replace placeholder text with your bio
   - Update statistics (years experience, projects, technologies)
   - Add your professional photo (replace placeholder)

3. **Projects**:

   - Update project titles, descriptions, and tech stacks
   - Add actual GitHub and demo links
   - Replace placeholder icons with project screenshots

4. **Skills**:

   - Add/remove skills based on your expertise
   - Update icons using Font Awesome classes

5. **Experience**:

   - Update job titles, companies, and dates
   - Modify descriptions and technologies used

6. **Contact**:
   - Update email, phone, and location
   - Add your social media links
   - Customize contact form fields if needed

### Adding Your Photo

Replace the placeholder in the About section:

```html
<div class="image-placeholder">
  <!-- Replace with your actual image -->
  <img
    src="path/to/your/photo.jpg"
    alt="Your Name"
    style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"
  />
</div>
```

### Adding Project Images

Replace the placeholder icons in project cards:

```html
<div class="project-image">
  <img
    src="path/to/project-screenshot.jpg"
    alt="Project Name"
    style="width: 100%; height: 100%; object-fit: cover;"
  />
</div>
```

## 🚀 Getting Started

### Option 1: Use as Template (Recommended)

1. **Fork this repository** - Click the "Fork" button at the top right
2. **Clone your fork** - `git clone https://github.com/YOUR_USERNAME/software-engineer-portfolio.git`
3. **Customize** the content in `index.html` with your information
4. **Update** the styling in `styles.css` if desired
5. **Enable GitHub Pages** - Go to Settings > Pages > Source > Deploy from branch > main
6. **Your portfolio will be live** at `https://YOUR_USERNAME.github.io/software-engineer-portfolio`

### Option 2: Manual Setup

1. **Download/Clone** the files to your local machine
2. **Run setup script** - `chmod +x setup-github.sh && ./setup-github.sh`
3. **Follow the instructions** provided by the setup script
4. **Customize** the content in `index.html` with your information
5. **Test** the website locally by opening `index.html` in a browser
6. **Deploy** to your preferred hosting service (GitHub Pages, Netlify, Vercel, etc.)

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔧 Advanced Customization

### Adding New Sections

1. Add the HTML structure in `index.html`
2. Add corresponding CSS styles in `styles.css`
3. Update navigation menu if needed
4. Add JavaScript functionality if required

### Modifying Animations

Animation styles are defined in the JavaScript file. You can modify:

- Scroll-triggered animations
- Hover effects
- Loading animations
- Transition timings

### Adding More Projects

Duplicate the project card structure and update:

- Project title and description
- Technology tags
- GitHub and demo links
- Project image

## 📞 Support

For questions or customization help:

- **GitHub Issues**: Create an issue for bugs or feature requests
- **Code Comments**: Check the code comments for guidance
- **CSS Variables**: Review the CSS variables for easy color changes
- **Testing**: Test responsiveness on different screen sizes
- **Documentation**: Review the CONTRIBUTING.md file for development guidelines

## 🌟 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to:

- Report bugs
- Suggest features
- Submit pull requests
- Follow coding standards

## 📄 License

This template is free to use for personal and commercial projects. Attribution is appreciated but not required.

---

**Happy Coding! 🎉**
