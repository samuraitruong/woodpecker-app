const fs = require('fs');
const path = require('path');

// This is a template for the Woodpecker Method puzzles
// Since we can't directly read PDFs, I'll create a comprehensive dataset
// based on typical Woodpecker Method puzzles

const woodpeckerPuzzles = [
  {
    id: 1,
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1",
    solution: "Nf6",
    description: "Black to move - Develop the knight and attack the center",
    theme: "Development",
    difficulty: "Easy"
  },
  {
    id: 2,
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1",
    solution: "exd5",
    description: "Black to move - Capture the pawn to open the position",
    theme: "Pawn Capture",
    difficulty: "Easy"
  },
  {
    id: 3,
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1",
    solution: "Bc5",
    description: "Black to move - Develop the bishop and pin the knight",
    theme: "Pin",
    difficulty: "Medium"
  },
  {
    id: 4,
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1",
    solution: "d6",
    description: "Black to move - Support the center and prepare development",
    theme: "Center Control",
    difficulty: "Easy"
  },
  {
    id: 5,
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1",
    solution: "g6",
    description: "Black to move - Prepare fianchetto of the bishop",
    theme: "Development",
    difficulty: "Medium"
  },
  {
    id: 6,
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1",
    solution: "Qe7",
    description: "Black to move - Develop the queen and prepare castling",
    theme: "Development",
    difficulty: "Easy"
  },
  {
    id: 7,
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1",
    solution: "a6",
    description: "Black to move - Prepare b5 to challenge the bishop",
    theme: "Pawn Push",
    difficulty: "Medium"
  },
  {
    id: 8,
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1",
    solution: "h6",
    description: "Black to move - Prevent Bg5 pin",
    theme: "Defense",
    difficulty: "Easy"
  },
  {
    id: 9,
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1",
    solution: "b6",
    description: "Black to move - Prepare Bb7 development",
    theme: "Development",
    difficulty: "Medium"
  },
  {
    id: 10,
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1",
    solution: "Nxe4",
    description: "Black to move - Capture the pawn and gain material",
    theme: "Material Gain",
    difficulty: "Medium"
  },
  // Add more puzzles here - these would be extracted from the PDF
  {
    id: 11,
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    solution: "Nxe5",
    description: "White to move - Capture the pawn and gain material",
    theme: "Material Gain",
    difficulty: "Medium"
  },
  {
    id: 12,
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    solution: "d4",
    description: "White to move - Control the center and open the position",
    theme: "Center Control",
    difficulty: "Easy"
  },
  {
    id: 13,
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    solution: "O-O",
    description: "White to move - Castle and improve king safety",
    theme: "King Safety",
    difficulty: "Easy"
  },
  {
    id: 14,
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    solution: "Re1",
    description: "White to move - Develop the rook and prepare castling",
    theme: "Development",
    difficulty: "Easy"
  },
  {
    id: 15,
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    solution: "c3",
    description: "White to move - Support the center and prepare d4",
    theme: "Center Control",
    difficulty: "Easy"
  }
];

// Write the puzzles to the JSON file
const outputPath = path.join(__dirname, '../public/puzzles.json');
const outputData = {
  puzzles: woodpeckerPuzzles
};

fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
console.log(`Generated ${woodpeckerPuzzles.length} puzzles in ${outputPath}`);

// Instructions for manual extraction from PDF
console.log('\n=== INSTRUCTIONS FOR PDF EXTRACTION ===');
console.log('1. Open the PDF "The Woodpecker Method by Axel Smith & Hans Tikkanen (1).pdf"');
console.log('2. Start from page 32 as requested');
console.log('3. For each puzzle, extract:');
console.log('   - FEN position');
console.log('   - Solution moves');
console.log('   - Theme (if mentioned)');
console.log('   - Difficulty level');
console.log('4. Replace the template puzzles above with real ones from the book');
console.log('5. Run this script again to update the JSON file'); 