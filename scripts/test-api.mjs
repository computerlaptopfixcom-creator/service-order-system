
async function main() {
    console.log("Fetching orders from API...");
    try {
        const res = await fetch("http://localhost:3000/api/orders");
        if (!res.ok) {
            console.error("API error:", res.status, res.statusText);
            return;
        }
        const data = await res.json();
        console.log("API Data:", JSON.stringify(data, null, 2));

        const orders = data.orders || (Array.isArray(data) ? data : []);
        if (orders.length > 0) {
            const first = orders[0];
            console.log("First Order Check:");
            console.log("- OrderNumber:", first.orderNumber);
            console.log("- CreatedAt:", first.createdAt);
            console.log("- Is CreatedAt valid date string?", !isNaN(Date.parse(first.createdAt)));
        } else {
            console.log("No orders returned.");
        }

    } catch (e) {
        console.error("Fetch error:", e);
    }
}

main();
