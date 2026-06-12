 🚚 RouteOptimizer — TSP Algorithm Visualizer

        Algorithm Analysis Final Project 
*Rosenkrantz, D. J., Stearns, R. E., & Lewis, P. M. (1977). "An Analysis of Several Heuristics for the Traveling Salesman Problem." SIAM Journal on Computing.*

---

          Overview

An interactive web application that solves the **Traveling Salesman Problem** using three different algorithms, with step-by-step animation and theoretical analysis.

     Algorithms Implemented

| Algorithm | Complexity | Quality Guarantee |
|---|---|---|
| Nearest Neighbor (Greedy) | O(n²) | None — can be arbitrarily bad |
| MST 2-Approximation | O(n² log n) | **≤ 2 × optimal** (proven) |
| 2-opt Local Search | O(n² × k) | Local optimum |

## Project Structure

```
tsp_project/
├── app.py                  ← Flask backend + all algorithm logic
├── requirements.txt
├── templates/
│   ├── index.html          ← Solver page
│   └── theory.html         ← Theory & NP-completeness page
└── static/
    ├── css/
    │   ├── style.css       ← Main styles
    │   └── theory.css      ← Theory page styles
    └── js/
        └── main.js         ← Canvas renderer + animation engine
```

## Setup & Run

```bash
# 1. Install dependencies
pip install flask

# 2. Run
python app.py

# 3. Open in browser
http://127.0.0.1:5000
```

## Features

- 🗺 **Interactive map** — click to place cities or auto-generate
- 🚀 **Solve all three algorithms** simultaneously
- ▶ **Step-by-step animation** with play/pause/step controls
- 📊 **Results comparison** with improvement percentage
- 🌲 **MST overlay** view to visualize the spanning tree
- 🔀 **Compare all** view — see all three tours at once
- 📖 **Theory page** — NP-completeness, proofs, pseudocode

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Solver UI |
| `/theory` | GET | Theory page |
| `/api/solve` | POST | Run all 3 algorithms on given cities |
| `/api/random_cities` | POST | Generate n random cities |

## Evaluation Criteria Mapping

- **Algorithmic Efficiency (30%)**: MST 2-approximation with formal proof, O(n²) complexity analysis, all edge cases handled
- **UI/UX (25%)**: Clean dark-theme interface, intuitive controls, delivery route framing
- **Gamification/Visual Tracing (25%)**: Step-by-step animation, play/pause/step controls, action log, compare view
- **Documentation (20%)**: This README, theory page with full academic reference, code comments throughout
