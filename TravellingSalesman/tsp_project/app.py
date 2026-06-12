from flask import Flask, render_template, request, jsonify
import math, random

app = Flask(__name__)

# ── UTILS ──────────────────────────────────────────────────────────────────────
def dist(a, b):
    return math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2)

def tour_length(tour, cities):
    n = len(tour)
    return round(sum(dist(cities[tour[i]], cities[tour[(i+1)%n]]) for i in range(n)), 2)

# ── ALGORITHM 1: Nearest Neighbor (Greedy) ─────────────────────────────────────
def nearest_neighbor(cities):
    n = len(cities)
    unvisited = list(range(n))
    tour = [unvisited.pop(0)]
    steps = [{"tour": list(tour), "highlight": None, "action": "Start at city 0"}]
    while unvisited:
        cur = tour[-1]
        nearest = min(unvisited, key=lambda c: dist(cities[cur], cities[c]))
        unvisited.remove(nearest)
        tour.append(nearest)
        steps.append({"tour": list(tour), "highlight": nearest,
                       "action": f"Go to nearest unvisited city {nearest}"})
    tour_closed = tour + [tour[0]]
    steps.append({"tour": tour_closed, "highlight": tour[0], "action": "Return to start — tour complete"})
    return tour_closed, steps

# ── ALGORITHM 2: MST 2-Approximation ──────────────────────────────────────────
def prim_mst(cities):
    n = len(cities)
    in_mst = [False]*n
    key = [float('inf')]*n
    parent = [-1]*n
    key[0] = 0
    edges = []
    for _ in range(n):
        u = min((v for v in range(n) if not in_mst[v]), key=lambda v: key[v])
        in_mst[u] = True
        if parent[u] != -1:
            edges.append((parent[u], u))
        for v in range(n):
            if not in_mst[v]:
                d = dist(cities[u], cities[v])
                if d < key[v]:
                    key[v] = d
                    parent[v] = u
    adj = {i: [] for i in range(n)}
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    return adj, edges

def mst_approximation(cities):
    n = len(cities)
    adj, mst_edges = prim_mst(cities)
    visited = [False]*n
    tour = []
    steps = []

    def dfs(node):
        visited[node] = True
        tour.append(node)
        steps.append({"tour": list(tour), "highlight": node,
                       "action": f"DFS visit city {node}"})
        for nb in sorted(adj[node]):
            if not visited[nb]:
                dfs(nb)

    dfs(0)
    tour_closed = tour + [tour[0]]
    steps.append({"tour": tour_closed, "highlight": tour[0], "action": "Close tour — return to start"})
    return tour_closed, steps, mst_edges

# ── ALGORITHM 3: 2-opt ─────────────────────────────────────────────────────────
def two_opt(cities, initial_tour=None):
    n = len(cities)
    tour = list(initial_tour[:-1]) if initial_tour else list(range(n))
    steps = [{"tour": tour + [tour[0]], "highlight": None, "action": "Initial tour (from Nearest Neighbor)"}]
    improved = True
    swaps = 0
    while improved:
        improved = False
        for i in range(1, n-1):
            for j in range(i+1, n):
                a,b = tour[i-1], tour[i]
                c,d = tour[j], tour[(j+1)%n]
                if dist(cities[a],cities[b])+dist(cities[c],cities[d]) > \
                   dist(cities[a],cities[c])+dist(cities[b],cities[d]) + 1e-10:
                    tour[i:j+1] = reversed(tour[i:j+1])
                    improved = True
                    swaps += 1
                    steps.append({"tour": tour+[tour[0]], "highlight": i,
                                   "action": f"2-opt swap #{swaps}: reversed segment [{i}..{j}]"})
    steps.append({"tour": tour+[tour[0]], "highlight": None, "action": f"Optimized! {swaps} swaps total"})
    return tour + [tour[0]], steps

# ── ROUTES ─────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/theory")
def theory():
    return render_template("theory.html")

@app.route("/api/solve", methods=["POST"])
def solve():
    data = request.get_json()
    cities = data.get("cities", [])
    if len(cities) < 4:
        return jsonify({"error": "At least 4 cities required"}), 400

    nn_tour, nn_steps = nearest_neighbor(cities)
    mst_tour, mst_steps, mst_edges = mst_approximation(cities)
    opt_tour, opt_steps = two_opt(cities, nn_tour)

    return jsonify({
        "nearest_neighbor": {"tour": nn_tour, "steps": nn_steps,
                              "distance": tour_length(nn_tour, cities), "label": "Nearest Neighbor"},
        "mst":              {"tour": mst_tour, "steps": mst_steps, "mst_edges": mst_edges,
                              "distance": tour_length(mst_tour, cities), "label": "MST 2-Approx"},
        "two_opt":          {"tour": opt_tour, "steps": opt_steps,
                              "distance": tour_length(opt_tour, cities), "label": "2-opt"},
    })

@app.route("/api/random_cities", methods=["POST"])
def random_cities():
    n = max(5, min(int(request.get_json().get("n", 20)), 50))
    cities = [[random.randint(50, 750), random.randint(50, 450)] for _ in range(n)]
    return jsonify({"cities": cities})

if __name__ == "__main__":
    app.run(debug=True)
