# Venn with Friends 🎯

A creative multiplayer party game where players connect two random concepts with witty, clever phrases. Players can share their creations and get scored by friends or AI!

## Features

- **Solo Play**: Create connections between random concepts and get AI-scored
- **Multiplayer**: Real-time rooms where players compete simultaneously  
- **Friend Judging**: Share your creations via URL for friends to judge
- **AI Scoring**: Google Gemini evaluates submissions on wit, logic, originality, and clarity
- **Fusion Images**: AI-generated visualizations of creative connections

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment** (optional - game works without):
   - Copy `.env.example` to `.env`
   - Add Supabase credentials for multiplayer
   - Add Gemini API key for AI scoring/image generation

3. **Run in development**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Deploy to GitHub Pages**:
   ```bash
   # Run the deployment script
   ./scripts/deploy.ps1  # On Windows PowerShell
   ```
   See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment options.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Supabase (real-time database)
- **AI**: Google Gemini (scoring & image generation)
- **Multiplayer**: Real-time via Supabase realtime subscriptions

## Game Flow

### Solo Mode
1. Two random concept images appear
2. Player creates a witty connection phrase
3. AI judges submission on wit, logic, originality, clarity
4. Share results via URL for friend judging

### Multiplayer Mode  
1. Host creates room with room code
2. Players join with avatars and names
3. All players play rounds simultaneously
4. AI scoring determines winners
5. Real-time updates for all players

## Configuration

See [SETUP.md](SETUP.md) for detailed environment setup instructions.

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_SUPABASE_URL` | Multiplayer backend | Optional |
| `VITE_SUPABASE_ANON_KEY` | Database access | Optional |
| `VITE_GEMINI_API_KEY` | AI scoring & images | Optional |

**Note**: The app runs fine without these - multiplayer uses mock data, scoring uses mock scores, and images use curated themes.

## Development

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Build for production  
npm run build

# Preview production build
npm run preview
```

## File Structure

```
src/
├── components/          # Reusable UI components
├── context/            # React context providers
├── features/           # Feature-specific components
│   ├── gallery/        # Results gallery
│   ├── judge/          # Friend judging interface
│   ├── lobby/          # Game lobby/intro
│   ├── reveal/         # Results reveal
│   └── round/          # Core gameplay
├── services/           # API and external services
├── data/              # Static data and themes
└── lib/               # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use and modify!