export interface DemoCard {
  title: string;
  description: string;
  position: number;
}

export interface DemoColumn {
  name: string;
  position: number;
  cards: DemoCard[];
}

/**
 * Generate fun and engaging demo board content
 */
export function generateDemoBoardContent(): {
  boardTitle: string;
  boardDescription: string;
  columns: DemoColumn[];
} {
  return {
    boardTitle: "🚀 Welcome to Your Kanban Journey!",
    boardDescription: "Your personal demo board to explore the power of Kanban. Drag cards around, edit them, and see how organized you can be! 🎯",
    
    columns: [
      {
        name: "📚 Getting Started",
        position: 1000,
        cards: [
          {
            title: "🎉 Welcome to Kanban!",
            description: "Congratulations on starting your productivity journey! This demo board will show you how to organize tasks, track progress, and get things done.\n\n✨ Try clicking on cards to edit them\n📝 Drag cards between columns\n🎯 Create your own boards when ready",
            position: 1000,
          },
          {
            title: "🏗️ Set up your first real project",
            description: "Ready to move beyond the demo? Create your first project board! Consider what you're working on:\n\n• Personal goals 🎯\n• Work projects 💼\n• Home improvements 🏠\n• Learning objectives 📖\n\nThe key is to start simple and build from there.",
            position: 2000,
          },
          {
            title: "👥 Invite your team members",
            description: "Kanban works even better with collaboration! Once you're comfortable with the basics:\n\n🤝 Share boards with colleagues\n💬 Discuss tasks and progress\n🎊 Celebrate wins together\n\nTeamwork makes the dream work! ✨",
            position: 3000,
          },
          {
            title: "📖 Learn keyboard shortcuts",
            description: "Become a Kanban power user! Here are some pro tips:\n\n⌨️ Master keyboard shortcuts for speed\n🎨 Customize your workflow to match your style\n📊 Use different board views for different projects\n🔄 Regular reviews keep you on track",
            position: 4000,
          },
        ],
      },
      {
        name: "🔥 In Progress",
        position: 2000,
        cards: [
          {
            title: "☕ Plan the perfect morning routine",
            description: "Starting the day right sets the tone for everything else! What does your ideal morning look like?\n\n🌅 Wake up at a consistent time\n☕ Enjoy that first cup of coffee\n📱 Check priorities for the day\n🧘 Maybe some mindfulness or exercise\n\nSmall changes, big impact! 💪",
            position: 1000,
          },
          {
            title: "🎨 Design the ultimate workspace",
            description: "Your environment shapes your productivity! Whether it's physical or digital:\n\n🖥️ Organize your desk and screens\n🎵 Find the right background music or silence\n🪴 Add some life with plants\n💡 Perfect the lighting\n\nMake it yours! ✨",
            position: 2000,
          },
          {
            title: "🚀 Launch productivity to the moon",
            description: "Time to level up your game! You're getting the hang of this:\n\n📈 Track what's working well\n🔧 Adjust what isn't\n🎯 Set ambitious but achievable goals\n🌟 Stay consistent with the process\n\nYou've got this! 🌙",
            position: 3000,
          },
        ],
      },
      {
        name: "🎯 Ready for Review",
        position: 3000,
        cards: [
          {
            title: "✨ Polish that amazing feature",
            description: "The final touches make all the difference! Almost there:\n\n🔍 Double-check all the details\n🎨 Make it look and feel just right\n📝 Update any documentation\n💡 Consider user experience\n\nExcellence is in the details! ✨",
            position: 1000,
          },
          {
            title: "🔍 Quality check everything",
            description: "Before calling it done, let's make sure it's truly ready:\n\n✅ Test all the edge cases\n👥 Get feedback from others\n📋 Review against original requirements\n🎯 Confirm it meets the goal\n\nQuality over speed, always! 🌟",
            position: 2000,
          },
        ],
      },
      {
        name: "✅ Completed",
        position: 4000,
        cards: [
          {
            title: "🎊 Celebrate small wins",
            description: "You did it! Every completed task deserves recognition:\n\n🎉 Take a moment to appreciate progress\n📸 Maybe share the win with others\n☕ Treat yourself to something nice\n📝 Reflect on what you learned\n\nProgress is progress, no matter how small! 🌟",
            position: 1000,
          },
          {
            title: "📈 Track your awesome progress",
            description: "Look how far you've come! Regular reflection helps you:\n\n📊 See patterns in your productivity\n🎯 Identify what works best for you\n🚀 Plan even better for next time\n💪 Build confidence in your abilities\n\nData tells the story of your growth! 📚",
            position: 2000,
          },
          {
            title: "🌟 Become a Kanban master",
            description: "Congratulations! You're well on your way to mastering this system:\n\n🧠 You understand the flow\n⚡ You've found your rhythm\n🎨 You've made it your own\n🚀 You're ready for bigger challenges\n\nTime to create your own boards and conquer your goals! 🏆",
            position: 3000,
          },
        ],
      },
    ],
  };
}