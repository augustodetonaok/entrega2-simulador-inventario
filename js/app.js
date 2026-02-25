async function cargarProductosIniciales() {
    try {
        const response = await fetch("data/productos.json");
        const data = await response.json();

        if (!localStorage.getItem("productos")) {
            productos = data;
            guardarProductos();
            mostrarProductos();
        }

    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}

let productos = [];
let carrito = [];
let historialVentas = JSON.parse(localStorage.getItem("historialVentas")) || [];
let ventasDelDia = JSON.parse(localStorage.getItem("ventasDelDia")) || [];

const formProducto = document.getElementById("formProducto");
const listaProductosStock = document.getElementById("listaProductosStock");
const listaProductosVentas = document.getElementById("listaProductosVentas");
const nombreProducto = document.getElementById("nombreProducto");
const productosDatalist = document.getElementById("productosDatalist");
const cantidadProducto = document.getElementById("cantidadProducto");
const precioProducto = document.getElementById("precioProducto");
const subtotalCarrito = document.getElementById("subtotalCarrito");
const btnCobrar = document.getElementById("btnCobrar");
const searchStock = document.getElementById("searchStock");
const searchVentas = document.getElementById("searchVentas");

// menu / vistas
const menuStock = document.getElementById("menuStock");
const menuVentas = document.getElementById("menuVentas");
const menuCaja = document.getElementById("menuCaja");

function showView(viewId) {
    // ocultar todas las vistas
    document.querySelectorAll('.vista').forEach(v => v.style.display = 'none');
    const view = document.getElementById(viewId);
    // restaurar el display por defecto (dejar que el CSS decida, p.ej. display:flex en #view-ventas)
    if (view) view.style.display = '';
}

// conectar botones del menú
if (menuStock) menuStock.addEventListener('click', () => showView('view-stock'));
if (menuVentas) menuVentas.addEventListener('click', () => showView('view-ventas'));
if (menuCaja) menuCaja.addEventListener('click', () => showView('view-caja'));

// buscar en stock y ventas
if (searchStock) searchStock.addEventListener('input', mostrarProductos);
if (searchVentas) searchVentas.addEventListener('input', mostrarProductos);


// CARGA DESDE STORAGE

const productosGuardados = localStorage.getItem("productos");

if (productosGuardados) {
    productos = JSON.parse(productosGuardados);

    productos.forEach(p => {
        if (p.precio === undefined || isNaN(p.precio)) {
            p.precio = 0;
        }
    });

    ordenarProductos();
    guardarProductos();
    mostrarProductos();
    mostrarResumenDiario();
} else {
    cargarProductosIniciales();
}

// inicializar datalist si existe
if (typeof actualizarDatalist === 'function') actualizarDatalist();

// UTILIDADES


function crearProducto(nombre, cantidad, precio) {
    return { nombre, cantidad, precio };
}

function ordenarProductos() {
    productos.sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
    );
}

function guardarProductos() {
    localStorage.setItem("productos", JSON.stringify(productos));
    // actualizar datalist de autocompletado
    if (typeof actualizarDatalist === 'function') actualizarDatalist();
}

function actualizarDatalist() {
    if (!productosDatalist) return;
    productosDatalist.innerHTML = '';
    productos.forEach(p => {
        const option = document.createElement('option');
        option.value = p.nombre;
        productosDatalist.appendChild(option);
    });
}

function calcularValorTotal() {
    let total = productos.reduce((acc, p) => acc + p.cantidad * p.precio, 0);

    document.getElementById("valorTotal").textContent =
        "Valor total del inventario: $" + total.toLocaleString();
}

// AGREGAR PRODUCTO


formProducto.addEventListener("submit", e => {
    e.preventDefault();

    const nombre = nombreProducto.value.trim();
    const cantidad = parseInt(cantidadProducto.value);
    const precio = parseFloat(precioProducto.value);

    // normalizar nombre para evitar duplicados por mayúsculas/spaces
    const nombreNorm = nombre.toLowerCase();

    agregarProducto(nombreNorm, cantidad, precio);
    formProducto.reset();
});

// autocompletado: si el nombre coincide exactamente con un producto existente, completar el precio
if (nombreProducto) {
    nombreProducto.addEventListener('input', () => {
        const val = nombreProducto.value.trim().toLowerCase();
        if (!val) return;
        const match = productos.find(p => p.nombre.trim().toLowerCase() === val);
        if (match) {
            // solo completar precio si el campo está vacío o es 0
            if (precioProducto && (!precioProducto.value || precioProducto.value == 0)) {
                precioProducto.value = match.precio;
            }
        }
    });
}

function agregarProducto(nombre, cantidad, precio) {
    // buscar por nombre normalizado (trim + toLowerCase)
    const nombreNorm = nombre.trim().toLowerCase();
    let existente = productos.find(p => p.nombre.trim().toLowerCase() === nombreNorm);

    if (existente) {
        existente.cantidad += cantidad;
        existente.precio = precio;
    } else {
        // conservar el nombre como ingresado (capitalización original)
        productos.push(crearProducto(nombre, cantidad, precio));
    }

    ordenarProductos();
    guardarProductos();
    mostrarProductos();

    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Producto guardado',
        showConfirmButton: false,
        timer: 1200
    });
}

// MOSTRAR INVENTARIO


function mostrarProductos() {
    // Limpiar ambas listas (stock y ventas)
    if (listaProductosStock) listaProductosStock.innerHTML = "";
    if (listaProductosVentas) listaProductosVentas.innerHTML = "";

    const searchTermStock = searchStock ? searchStock.value.trim().toLowerCase() : '';
    const searchTermVentas = searchVentas ? searchVentas.value.trim().toLowerCase() : '';

    // ITEMS PARA STOCK
    const itemsStock = productos
        .map((p, idx) => ({ p, idx }))
        .filter(({ p }) => p.nombre.toLowerCase().includes(searchTermStock));

    itemsStock.forEach(({ p: producto, idx: i }) => {
        const itemStock = document.createElement("div");
        itemStock.classList.add("producto-item");

        const pStock = document.createElement('p');
        const strongStock = document.createElement('strong');
        strongStock.textContent = producto.nombre;
        pStock.appendChild(strongStock);
        pStock.appendChild(document.createElement('br'));
        pStock.appendChild(document.createTextNode('Stock: ' + producto.cantidad));
        pStock.appendChild(document.createElement('br'));
        pStock.appendChild(document.createTextNode('Precio: $' + producto.precio.toLocaleString()));

        const botonesStock = document.createElement('div');
        botonesStock.classList.add('botones');

        const btnSum = document.createElement('button'); btnSum.textContent = '➕'; btnSum.setAttribute('onclick', `sumarStock(${i})`);
        const btnRest = document.createElement('button'); btnRest.textContent = '➖'; btnRest.setAttribute('onclick', `restarStock(${i})`);
        const btnEdit = document.createElement('button'); btnEdit.textContent = 'Editar precio'; btnEdit.addEventListener('click', () => editarPrecio(i));
        const btnDel = document.createElement('button'); btnDel.textContent = '🗑'; btnDel.setAttribute('onclick', `eliminarProducto(${i})`);

        botonesStock.appendChild(btnSum);
        botonesStock.appendChild(btnRest);
        botonesStock.appendChild(btnEdit);
        botonesStock.appendChild(btnDel);

        itemStock.appendChild(pStock);
        itemStock.appendChild(botonesStock);

        if (listaProductosStock) listaProductosStock.appendChild(itemStock);
    });

    // ITEMS PARA VENTAS (lista a la izquierda en vista-ventas)
    const itemsVentas = productos
        .map((p, idx) => ({ p, idx }))
        .filter(({ p }) => p.nombre.toLowerCase().includes(searchTermVentas));

    itemsVentas.forEach(({ p: producto, idx: i }) => {
        const itemVentas = document.createElement('div');
        itemVentas.classList.add('producto-item');

        const pVentas = document.createElement('p');
        const strongVentas = document.createElement('strong');
        strongVentas.textContent = producto.nombre;
        pVentas.appendChild(strongVentas);
        pVentas.appendChild(document.createElement('br'));
        pVentas.appendChild(document.createTextNode('Stock: ' + producto.cantidad));
        pVentas.appendChild(document.createElement('br'));
        pVentas.appendChild(document.createTextNode('Precio: $' + producto.precio.toLocaleString()));

        const botonesVentas = document.createElement('div');
        botonesVentas.classList.add('botones');
        const btnAddVenta = document.createElement('button'); btnAddVenta.textContent = '🛒 Agregar'; btnAddVenta.setAttribute('onclick', `agregarAlCarrito(${i})`);
        botonesVentas.appendChild(btnAddVenta);

        itemVentas.appendChild(pVentas);
        itemVentas.appendChild(botonesVentas);

        if (listaProductosVentas) listaProductosVentas.appendChild(itemVentas);
    });

    calcularValorTotal();
}

// Editar precio con SweetAlert
function editarPrecio(i) {
    const producto = productos[i];
    if (!producto) return;

    Swal.fire({
        title: `Editar precio - ${producto.nombre}`,
        input: 'number',
        inputValue: producto.precio,
        inputAttributes: {
            min: 0,
            step: '0.01'
        },
        showCancelButton: true,
        confirmButtonText: 'Guardar'
    }).then(result => {
        if (!result.isConfirmed) return;
        const nuevo = parseFloat(result.value);
        if (isNaN(nuevo) || nuevo < 0) {
            Swal.fire('Precio inválido', 'Ingrese un número válido mayor o igual a 0', 'error');
            return;
        }

        producto.precio = nuevo;
        guardarProductos();
        mostrarProductos();

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Precio actualizado',
            showConfirmButton: false,
            timer: 1200
        });
    });
}

// STOCK

function sumarStock(i) {
    productos[i].cantidad++;
    guardarProductos();
    mostrarProductos();
}

function restarStock(i) {
    if (productos[i].cantidad > 0) {
        productos[i].cantidad--;
        guardarProductos();
        mostrarProductos();
    }
}

function eliminarProducto(i) {
    productos.splice(i, 1);
    guardarProductos();
    mostrarProductos();
}


// CARRITO

function agregarAlCarrito(i) {
    const producto = productos[i];

    if (producto.cantidad === 0) {
        Swal.fire("Sin stock", "", "error");
        return;
    }

    let item = carrito.find(p => p.nombre === producto.nombre);
    let cantidadEnCarrito = item ? item.cantidad : 0;

    if (cantidadEnCarrito >= producto.cantidad) {
        Swal.fire("Stock insuficiente", "", "warning");
        return;
    }

    if (item) {
        item.cantidad++;
    } else {
        carrito.push({
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1
        });
    }

    mostrarCarrito();
}

function mostrarCarrito() {
    const lista = document.getElementById("carritoLista");
    lista.innerHTML = "";

    let subtotal = 0;

    carrito.forEach((item, i) => {
        subtotal += item.precio * item.cantidad;

        const div = document.createElement("div");

        div.innerHTML = `
            <strong>${item.nombre}</strong><br>
            Cantidad:
            <button onclick="disminuirCantidad(${i})">➖</button>
            ${item.cantidad}
            <button onclick="aumentarCantidad(${i})">➕</button><br>
            Total: $${(item.precio * item.cantidad).toLocaleString()}<br>
            <button onclick="quitarDelCarrito(${i})">❌ Quitar</button>
            <hr>
        `;
        lista.appendChild(div);
    });

    subtotalCarrito.textContent =
        "Subtotal: $" + subtotal.toLocaleString();
}

function aumentarCantidad(i) {
    const item = carrito[i];
    const producto = productos.find(p => p.nombre === item.nombre);

    if (item.cantidad >= producto.cantidad) {
        Swal.fire("Stock máximo alcanzado");
        return;
    }

    item.cantidad++;
    mostrarCarrito();
}

function disminuirCantidad(i) {
    if (carrito[i].cantidad > 1) {
        carrito[i].cantidad--;
    } else {
        carrito.splice(i, 1);
    }
    mostrarCarrito();
}

function quitarDelCarrito(i) {
    carrito.splice(i, 1);
    mostrarCarrito();
}


// COBRAR

document.getElementById("btnCobrar").addEventListener("click", cobrar);

function cobrar() {
    if (carrito.length === 0) {
        Swal.fire("El carrito está vacío");
        return;
    }

    const subtotal = carrito.reduce((acc, item) =>
        acc + item.precio * item.cantidad, 0
    );

    Swal.fire({
        title: "Confirmar venta",
        html: `Total: <b>$${subtotal}</b>`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Cobrar"
    }).then(result => {
        if (!result.isConfirmed) return;

        let total = 0;

        carrito.forEach(item => {
            const producto = productos.find(p => p.nombre === item.nombre);

            if (producto.cantidad < item.cantidad) return;

            producto.cantidad -= item.cantidad;
            total += item.precio * item.cantidad;
        });

        guardarProductos();

        const venta = {
            fecha: new Date().toLocaleString(),
            items: [...carrito],
            total: total
        };

        historialVentas.push(venta);
        ventasDelDia.push(venta);

        localStorage.setItem("historialVentas", JSON.stringify(historialVentas));
        localStorage.setItem("ventasDelDia", JSON.stringify(ventasDelDia));
        carrito = [];

        mostrarCarrito();
        mostrarProductos();
        mostrarHistorial();
        mostrarResumenDiario();

        Swal.fire({
            icon: "success",
            title: "Venta realizada",
            text: `Se cobraron $${total.toLocaleString()}`,
            timer: 1500,
            showConfirmButton: false
        });
    });
}

mostrarProductos();
// Mostrar vista por defecto
showView('view-ventas');

function mostrarHistorial() {
    const contenedor = document.getElementById("historialVentas");
    contenedor.innerHTML = "";

    historialVentas.slice().reverse().forEach(venta => {
        const div = document.createElement("div");
        div.classList.add("venta-item");

        let itemsHTML = "";

        venta.items.forEach(item => {
            itemsHTML += `${item.nombre} x${item.cantidad}<br>`;
        });

        div.innerHTML = `
            <strong>${venta.fecha}</strong><br>
            ${itemsHTML}
            Total: $${venta.total.toLocaleString()}
            <hr>
        `;

        contenedor.appendChild(div);
    });
}
mostrarHistorial();

function mostrarResumenDiario() {
    const totalVentas = ventasDelDia.reduce((acc, v) => acc + v.total, 0);
    const cantidadVentas = ventasDelDia.length;
    const ticketPromedio = cantidadVentas > 0
        ? totalVentas / cantidadVentas
        : 0;

    document.getElementById("totalDia").textContent =
        "Total del día: $" + totalVentas.toLocaleString();

    document.getElementById("cantidadVentas").textContent =
        "Ventas realizadas: " + cantidadVentas;

    document.getElementById("ticketPromedio").textContent =
        "Ticket promedio: $" + ticketPromedio.toFixed(2);
}

function cerrarCaja() {
    if (ventasDelDia.length === 0) {
        Swal.fire("No hay ventas para cerrar");
        return;
    }

    Swal.fire({
        title: "Cerrar caja",
        text: "Se reiniciarán las estadísticas del día",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Cerrar caja"
    }).then(result => {
        if (!result.isConfirmed) return;

        ventasDelDia = [];
        localStorage.removeItem("ventasDelDia");

        mostrarResumenDiario();

        Swal.fire("Caja cerrada ✔");
    });
}