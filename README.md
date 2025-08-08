# 🎮 Voxel Game - Minecraft Style

A browser-based voxel game inspired by Minecraft, built with Three.js. Features optimized rendering, mobile and desktop controls, and responsive design.

![Game Preview](https://img.shields.io/badge/Status-Live-brightgreen)
![Three.js](https://img.shields.io/badge/Three.js-r136-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🌟 Features

- **3D Voxel World**: Explore a procedurally generated terrain made of blocks
- **Cross-Platform Controls**: 
  - Desktop: WASD/Arrow keys + Mouse with pointer lock
  - Mobile: Touch controls for movement and camera
- **Optimized Performance**: 
  - InstancedMesh for efficient block rendering
  - RequestAnimationFrame for smooth gameplay
  - FPS counter for performance monitoring
- **Responsive Design**: Adapts to any screen size
- **Physics Simulation**: Basic gravity and jump mechanics

## 🚀 Live Demo

Play the game directly in your browser: [Live Demo](https://drakeone.github.io/voxel-game-minecraft-style/)

## 🎮 Controls

### Desktop
- **W/↑**: Move forward
- **S/↓**: Move backward
- **A/←**: Move left
- **D/→**: Move right
- **Space**: Jump
- **Mouse**: Look around (click to enable pointer lock)

### Mobile
- Use the on-screen touch buttons for movement
- Swipe to look around

## 🛠️ Technologies

- **Three.js r136**: 3D graphics library
- **HTML5 Canvas**: Rendering surface
- **Vanilla JavaScript**: Core game logic
- **CSS3**: Responsive styling

## 📦 Installation

### Option 1: Play Online
Simply visit the [live demo](https://drakeone.github.io/voxel-game-minecraft-style/)

### Option 2: Run Locally

1. Clone the repository:
```bash
git clone https://github.com/DrakeOne/voxel-game-minecraft-style.git
cd voxel-game-minecraft-style
```

2. Start a local web server. You can use any of these methods:

   **Using Python:**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Using Node.js (http-server):**
   ```bash
   # Install globally
   npm install -g http-server
   
   # Run server
   http-server
   ```

   **Using VS Code:**
   - Install the "Live Server" extension
   - Right-click on `index.html`
   - Select "Open with Live Server"

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## 📁 Project Structure

```
voxel-game-minecraft-style/
│
├── index.html      # Main HTML file with game canvas
├── style.css       # Responsive styles and UI
├── main.js         # Core game logic and Three.js implementation
└── README.md       # Project documentation
```

## 🔧 Configuration

The game includes several configurable parameters in `main.js`:

```javascript
let moveSpeed = 5;        // Player movement speed
const chunkSize = 16;     // Size of terrain chunk
const blockSize = 1;      // Size of individual blocks
```

## 🎯 Optimization Techniques

1. **InstancedMesh**: Renders multiple blocks with a single draw call
2. **RequestAnimationFrame**: Ensures smooth 60 FPS gameplay
3. **Efficient Collision Detection**: Simple AABB collision with ground
4. **Responsive Controls**: Adapts to device capabilities

## 🚧 Future Enhancements

- [ ] Block placement and destruction
- [ ] Multiple block types and textures
- [ ] Procedural world generation
- [ ] Save/Load functionality
- [ ] Multiplayer support
- [ ] Sound effects and music
- [ ] Day/night cycle
- [ ] Inventory system
- [ ] Crafting mechanics

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Minecraft by Mojang Studios
- Built with [Three.js](https://threejs.org/)
- Icons and UI inspired by classic voxel games

## 📧 Contact

Project Link: [https://github.com/DrakeOne/voxel-game-minecraft-style](https://github.com/DrakeOne/voxel-game-minecraft-style)

---

Made with ❤️ using Three.js