## 📈 Advanced Budget Tracker<br><br>
A modern, responsive budget tracking web application that helps users manage income, expenses, monthly goals, and financial trends — all client-side, with no backend required.
Built using HTML, CSS, JavaScript, Bootstrap, Chart.js, and LocalStorage.
## ✨ Features<br><br>
## 📊 Dashboard
View current balance, total income, and total expenses<br><br>
Filter data by month<br><br>
Switch between multiple currencies<br><br>
Visualize spending with:
Category-wise doughnut chart
6-month expense trend line chart
## 💰 Transactions Management<br><br>
Add income and expense transactions<br><br>
Edit or delete existing transactions<br><br>
Categorize transactions (Food, Rent, Utilities, etc.)<br><br>
Filter transaction history by month
## 🎯 Budget Goals
Set monthly spending limits per category<br><br>
Track progress with dynamic progress bars<br><br>
Visual indicators when nearing or exceeding limits
## 🌍 Currency Support
Supports multiple currencies (USD, EUR, GBP, JPY, CAD)<br><br>
Real-time exchange rates using ExchangeRate API<br><br>
Base currency stored in USD for consistency
## 💾 Persistent Storage
Uses LocalStorage<br><br>
Data remains intact even after page refresh
## 🛠️ Tech Stack
HTML5
CSS3
JavaScript (ES6+)
Bootstrap 5
Chart.js
LocalStorage API
ExchangeRate API
## 📂 Project Structure
Copy code

📁 Advanced-Budget-Tracker
├── index.html         
├── transactions.html    
├── style.css           
├── script.js          
└── README.md
🚀 Getting Started
1️⃣ Clone the repository
Copy code
Bash
git clone https://github.com/your-username/advanced-budget-tracker.git
2️⃣ Open the app
Simply open index.html in your browser
(No server or installation required)
🧠 How It Works
All transactions are stored in LocalStorage
Charts update dynamically based on:
Selected month
Currency
Added/edited transactions
Budget goals compare actual expenses vs limits
Exchange rates are fetched once per session
📸 Screenshots (Optional)
Add screenshots here for better presentation
🔮 Future Improvements
Dark mode toggle 🌙
Export data to CSV 📄
Category-wise monthly reports
Authentication & cloud sync
React / SPA version
🤝 Contributing
Contributions are welcome!
If you’d like to improve UI, add features, or fix bugs:
Fork the repository
Create a new branch
Submit a pull request
📜 License
This project is open-source and available under the MIT License.
🙌 Acknowledgements
Bootstrap
Chart.js
ExchangeRate API
⭐ If you like this project, consider giving it a star!
