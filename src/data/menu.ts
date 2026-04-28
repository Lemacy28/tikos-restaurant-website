export type MenuItem = {
  name: string;
  description: string;
  price: number; // KES
  tag?: string;
};

export type MenuCategory = {
  id: string;
  title: string;
  items: MenuItem[];
};

export const menu: MenuCategory[] = [
  {
    id: "chicken",
    title: "Signature Chicken",
    items: [
      { name: "Tikos Crispy Bucket (8pc)", description: "Our legendary hand-breaded chicken with secret spice blend.", price: 1450, tag: "Bestseller" },
      { name: "Quarter Chicken & Chips", description: "Crispy quarter chicken, golden fries, house dip.", price: 650 },
      { name: "Half Chicken Platter", description: "Half chicken, two sides, kachumbari.", price: 1100 },
      { name: "Spicy Fire Wings (6pc)", description: "Tossed in our signature scotch bonnet glaze.", price: 550, tag: "Spicy" },
    ],
  },
  {
    id: "burgers",
    title: "Burgers & Wraps",
    items: [
      { name: "Tikos Big Chick Burger", description: "Double crispy fillet, cheddar, lettuce, special sauce.", price: 720, tag: "New" },
      { name: "Smoky BBQ Chicken Wrap", description: "Grilled chicken, smoked BBQ, slaw in a soft tortilla.", price: 580 },
      { name: "Classic Beef Burger", description: "Juicy beef patty, cheese, caramelised onions.", price: 690 },
    ],
  },
  {
    id: "sides",
    title: "Sides",
    items: [
      { name: "Crispy Fries", description: "Golden, salted, seasoned.", price: 250 },
      { name: "Loaded Cheesy Fries", description: "Fries, cheese sauce, jalapeños, herbs.", price: 420 },
      { name: "Coleslaw", description: "Creamy, crunchy, cooling.", price: 180 },
      { name: "Ugali", description: "Fresh, hot.", price: 100 },
    ],
  },
  {
    id: "drinks",
    title: "Drinks",
    items: [
      { name: "Fresh Passion Juice", description: "Locally sourced, no added sugar.", price: 220 },
      { name: "Tikos Strawberry Mojito (Mocktail)", description: "Strawberry, mint, lime, soda.", price: 350 },
      { name: "Iced Dawa", description: "Honey, lemon, ginger over ice.", price: 280 },
      { name: "Soft Drink (500ml)", description: "Coke, Fanta, Sprite, Stoney.", price: 120 },
      { name: "Tusker Lager", description: "Ice-cold Kenyan classic.", price: 280 },
    ],
  },
  {
    id: "desserts",
    title: "Desserts",
    items: [
      { name: "Molten Chocolate Cake", description: "Warm chocolate cake with vanilla ice cream.", price: 380 },
      { name: "Mandazi & Honey", description: "Fluffy mandazi served with wild honey.", price: 220 },
    ],
  },
];
