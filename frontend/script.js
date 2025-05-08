document.addEventListener('DOMContentLoaded', function() {
    // Données des villes du Togo avec coordonnées approximatives et distances
    const villesTogo = {
        'Lomé': { lat: 6.130419, lng: 1.215829, distances: {
            'Kara': 413, 'Sokodé': 355, 'Atakpamé': 161, 'Dapaong': 638, 
            'Tsévié': 35, 'Aného': 45, 'Kpalimé': 121, 'Bassar': 425, 'Mango': 711
        }},
        'Kara': { lat: 9.551111, lng: 1.186111, distances: {
            'Lomé': 413, 'Sokodé': 112, 'Atakpamé': 280, 'Dapaong': 225, 
            'Tsévié': 448, 'Aného': 458, 'Kpalimé': 534, 'Bassar': 12, 'Mango': 298
        }},
        'Sokodé': { lat: 8.983333, lng: 1.133333, distances: {
            'Lomé': 355, 'Kara': 112, 'Atakpamé': 168, 'Dapaong': 337, 
            'Tsévié': 390, 'Aného': 400, 'Kpalimé': 476, 'Bassar': 124, 'Mango': 410
        }},
        'Atakpamé': { lat: 7.533333, lng: 1.133333, distances: {
            'Lomé': 161, 'Kara': 280, 'Sokodé': 168, 'Dapaong': 505, 
            'Tsévié': 196, 'Aného': 206, 'Kpalimé': 282, 'Bassar': 292, 'Mango': 578
        }},
        'Dapaong': { lat: 10.866667, lng: 0.2, distances: {
            'Lomé': 638, 'Kara': 225, 'Sokodé': 337, 'Atakpamé': 505, 
            'Tsévié': 673, 'Aného': 683, 'Kpalimé': 759, 'Bassar': 237, 'Mango': 73
        }},
        'Tsévié': { lat: 6.433333, lng: 1.216667, distances: {
            'Lomé': 35, 'Kara': 448, 'Sokodé': 390, 'Atakpamé': 196, 
            'Dapaong': 673, 'Aného': 80, 'Kpalimé': 86, 'Bassar': 460, 'Mango': 746
        }},
        'Aného': { lat: 6.233333, lng: 1.6, distances: {
            'Lomé': 45, 'Kara': 458, 'Sokodé': 400, 'Atakpamé': 206, 
            'Dapaong': 683, 'Tsévié': 80, 'Kpalimé': 166, 'Bassar': 470, 'Mango': 756
        }},
        'Kpalimé': { lat: 6.9, lng: 0.633333, distances: {
            'Lomé': 121, 'Kara': 534, 'Sokodé': 476, 'Atakpamé': 282, 
            'Dapaong': 759, 'Tsévié': 86, 'Aného': 166, 'Bassar': 546, 'Mango': 832
        }},
        'Bassar': { lat: 9.25, lng: 0.783333, distances: {
            'Lomé': 425, 'Kara': 12, 'Sokodé': 124, 'Atakpamé': 292, 
            'Dapaong': 237, 'Tsévié': 460, 'Aného': 470, 'Kpalimé': 546, 'Mango': 310
        }},
        'Mango': { lat: 10.366667, lng: 0.466667, distances: {
            'Lomé': 711, 'Kara': 298, 'Sokodé': 410, 'Atakpamé': 578, 
            'Dapaong': 73, 'Tsévié': 746, 'Aného': 756, 'Kpalimé': 832, 'Bassar': 310
        }}
    };

    // Tarifs par classe (FCFA par km)
    const tarifs = {
        'Economique': 50,
        'Confort': 75,
        'VIP': 120
    };

    // Initialiser le localStorage si vide
    if (!localStorage.getItem('tickets')) {
        localStorage.setItem('tickets', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    
    // Initialiser la carte Leaflet
    const map = L.map('map').setView([8.6195, 0.8248], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Ajouter les marqueurs pour chaque ville
    Object.entries(villesTogo).forEach(([ville, data]) => {
        L.marker([data.lat, data.lng]).addTo(map)
            .bindPopup(ville);
    });

    let routePolyline = null;
    let startMarker = null;
    let endMarker = null;

    // Charger les tickets existants
    loadTickets();
    
    // Navigation entre sections
    document.querySelectorAll('nav ul li a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('nav ul li a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
            });
            
            const sectionId = this.id.replace('nav', '') + 'Section';
            document.getElementById(sectionId).style.display = 'block';
            
            if (sectionId === 'horairesSection') loadHoraires();
            if (sectionId === 'tarifsSection') loadTarifs();
            if (sectionId === 'contactSection') loadContact();
        });
    });
    
    // Gérer la soumission du formulaire de réservation
    document.getElementById('reservationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nom = document.getElementById('nom').value;
        const depart = document.getElementById('depart').value;
        const arrivee = document.getElementById('arrivee').value;
        const date = document.getElementById('date').value;
        const heure = document.getElementById('heure').value;
        const places = document.getElementById('places').value;
        const classe = document.getElementById('classe').value;
        
        if (depart === arrivee) {
            showAlert('error', 'La ville de départ et d\'arrivée doivent être différentes');
            return;
        }
        
        const distance = villesTogo[depart].distances[arrivee];
        const prixUnitaire = distance * tarifs[classe];
        const prixTotal = prixUnitaire * places;
        
        const newTicket = {
            id: Date.now(),
            nom,
            depart,
            arrivee,
            date,
            heure,
            places,
            classe,
            distance,
            prixUnitaire,
            prixTotal,
            dateReservation: new Date().toLocaleString('fr-FR'),
            statut: 'confirmé'
        };
        
        const tickets = JSON.parse(localStorage.getItem('tickets'));
        tickets.push(newTicket);
        localStorage.setItem('tickets', JSON.stringify(tickets));
        
        loadTickets();
        this.reset();
        
        // Afficher la section de paiement
        showPaymentSection(newTicket);
    });
    
    // Afficher la section de paiement
    function showPaymentSection(ticket) {
        const paymentSection = document.getElementById('paymentSection');
        paymentSection.style.display = 'block';
        
        // Mettre à jour le montant
        document.getElementById('paymentAmount').textContent = ticket.prixTotal;
        
        // Générer le QR code
        generateQRCode(ticket);
        
        // Faire défiler jusqu'à la section de paiement
        paymentSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Générer un QR code pour le paiement
    function generateQRCode(ticket) {
        document.getElementById('qrcode').innerHTML = '';
        
        const transactionCode = 'SOTRAL-' + ticket.id;
        document.getElementById('paymentCode').textContent = transactionCode;
        
        // Données de paiement pour le QR code
        const paymentData = {
            merchant: 'SOTRAL TOGO',
            account: 'TG00123456789',
            amount: ticket.prixTotal,
            currency: 'XOF',
            reference: transactionCode,
            ticketId: ticket.id,
            timestamp: new Date().toISOString()
        };
        
        // Créer le QR code
        new QRCode(document.getElementById('qrcode'), {
            text: JSON.stringify(paymentData),
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        // Démarrer la vérification du paiement
        checkPaymentStatus(ticket.id);
    }
    
    // Vérifier le statut du paiement
    function checkPaymentStatus(ticketId) {
        let checks = 0;
        const maxChecks = 10; // 10 tentatives maximum
        const interval = setInterval(() => {
            checks++;
            
            // Simuler une vérification de paiement (dans la réalité, vous appelleriez une API)
            const isPaid = checks >= 3 && Math.random() > 0.5; // Après 3 checks, 50% de chance que le paiement soit confirmé
            
            if (isPaid || checks >= maxChecks) {
                clearInterval(interval);
                if (isPaid) {
                    // Mettre à jour le statut du ticket
                    const tickets = JSON.parse(localStorage.getItem('tickets'));
                    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
                    if (ticketIndex !== -1) {
                        tickets[ticketIndex].statut = 'payé';
                        localStorage.setItem('tickets', JSON.stringify(tickets));
                    }
                    
                    // Afficher la confirmation
                    document.getElementById('paymentConfirmation').style.display = 'block';
                    document.getElementById('confirmationNumber').textContent = 'SOTRAL-' + ticketId;
                    
                    // Faire défiler jusqu'à la confirmation
                    document.getElementById('paymentConfirmation').scrollIntoView({ behavior: 'smooth' });
                } else {
                    showAlert('error', 'Paiement non reçu. Veuillez réessayer ou choisir une autre méthode.');
                }
            }
        }, 3000); // Vérifier toutes les 3 secondes
    }
    
    // Gérer les méthodes de paiement
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.payment-details').forEach(detail => {
                detail.style.display = 'none';
            });
            
            const methodType = this.getAttribute('data-method');
            document.getElementById(methodType + 'Details').style.display = 'block';
        });
    });
    
    // Vérification manuelle du paiement
    document.getElementById('verifyPaymentBtn').addEventListener('click', function() {
        // Simuler une vérification réussie
        document.getElementById('paymentConfirmation').style.display = 'block';
        document.getElementById('confirmationNumber').textContent = 'SOTRAL-' + Date.now();
    });
    
    // Voir le ticket après paiement
    document.getElementById('viewTicketBtn').addEventListener('click', function() {
        const tickets = JSON.parse(localStorage.getItem('tickets'));
        const lastTicket = tickets[tickets.length - 1];
        showTicketDetails(lastTicket.id);
    });
    
    // Gérer le changement de ville de départ ou d'arrivée
    document.getElementById('depart').addEventListener('change', updateRouteInfo);
    document.getElementById('arrivee').addEventListener('change', updateRouteInfo);
    
    function updateRouteInfo() {
        const depart = document.getElementById('depart').value;
        const arrivee = document.getElementById('arrivee').value;
        
        if (depart && arrivee && depart !== arrivee) {
            const distance = villesTogo[depart].distances[arrivee];
            const duree = Math.round(distance / 60 * 10) / 10;
            
            document.getElementById('distance').textContent = distance;
            document.getElementById('duree').textContent = duree;
            
            const classe = document.getElementById('classe').value;
            const prixUnitaire = distance * tarifs[classe];
            document.getElementById('prix').textContent = prixUnitaire;
            
            updateRouteDisplay(depart, arrivee);
        } else {
            document.getElementById('distance').textContent = '--';
            document.getElementById('duree').textContent = '--';
            document.getElementById('prix').textContent = '--';
            
            // Supprimer la ligne et les marqueurs de la carte
            if (routePolyline) map.removeLayer(routePolyline);
            if (startMarker) map.removeLayer(startMarker);
            if (endMarker) map.removeLayer(endMarker);
        }
    }
    
    // Mettre à jour l'affichage de la route sur la carte
    function updateRouteDisplay(depart, arrivee) {
        // Supprimer l'ancienne route si elle existe
        if (routePolyline) map.removeLayer(routePolyline);
        if (startMarker) map.removeLayer(startMarker);
        if (endMarker) map.removeLayer(endMarker);
        
        const startCoords = [villesTogo[depart].lat, villesTogo[depart].lng];
        const endCoords = [villesTogo[arrivee].lat, villesTogo[arrivee].lng];
        
        // Ajouter les marqueurs
        startMarker = L.marker(startCoords, {
            icon: L.divIcon({
                className: 'custom-icon',
                html: '<i class="fas fa-map-marker-alt" style="color: blue; font-size: 24px;"></i>',
                iconSize: [24, 24],
                iconAnchor: [12, 24]
            })
        }).addTo(map).bindPopup(`Départ: ${depart}`);
        
        endMarker = L.marker(endCoords, {
            icon: L.divIcon({
                className: 'custom-icon',
                html: '<i class="fas fa-map-marker-alt" style="color: red; font-size: 24px;"></i>',
                iconSize: [24, 24],
                iconAnchor: [12, 24]
            })
        }).addTo(map).bindPopup(`Arrivée: ${arrivee}`);
        
        // Tracer la ligne entre les deux points
        routePolyline = L.polyline([startCoords, endCoords], {
            color: 'green',
            weight: 3,
            dashArray: '5, 5'
        }).addTo(map);
        
        // Ajuster la vue pour voir les deux points
        map.fitBounds([startCoords, endCoords]);
    }
    
    // Mettre à jour le prix quand la classe change
    document.getElementById('classe').addEventListener('change', function() {
        const depart = document.getElementById('depart').value;
        const arrivee = document.getElementById('arrivee').value;
        
        if (depart && arrivee && depart !== arrivee) {
            const distance = villesTogo[depart].distances[arrivee];
            const classe = this.value;
            const prixUnitaire = distance * tarifs[classe];
            document.getElementById('prix').textContent = prixUnitaire;
        }
    });
    
    // Fonction pour charger les tickets
    function loadTickets() {
        const ticketsContainer = document.getElementById('ticketsContainer');
        ticketsContainer.innerHTML = '';
        
        let tickets = JSON.parse(localStorage.getItem('tickets'));
        
        // Filtrer par statut si un filtre est appliqué
        const filterStatus = document.getElementById('filterStatus').value;
        if (filterStatus !== 'all') {
            tickets = tickets.filter(ticket => ticket.statut === filterStatus);
        }
        
        // Filtrer par recherche si un terme est saisi
        const searchTerm = document.getElementById('searchTickets').value.toLowerCase();
        if (searchTerm) {
            tickets = tickets.filter(ticket => 
                ticket.nom.toLowerCase().includes(searchTerm) || 
                ticket.depart.toLowerCase().includes(searchTerm) || 
                ticket.arrivee.toLowerCase().includes(searchTerm) ||
                ticket.id.toString().includes(searchTerm)
            );
        }
        
        if (tickets.length === 0) {
            ticketsContainer.innerHTML = '<p class="no-tickets">Aucun ticket trouvé.</p>';
            return;
        }
        
        // Trier par date de réservation (du plus récent au plus ancien)
        tickets.sort((a, b) => new Date(b.dateReservation) - new Date(a.dateReservation));
        
        tickets.forEach(ticket => {
            const ticketElement = document.createElement('div');
            ticketElement.className = 'ticket';
            ticketElement.innerHTML = `
                <span class="ticket-status status-${ticket.statut}">${ticket.statut}</span>
                <h3>Ticket #${ticket.id}</h3>
                <p><i class="fas fa-user"></i> ${ticket.nom}</p>
                <p><i class="fas fa-route"></i> ${ticket.depart} → ${ticket.arrivee}</p>
                <p><i class="fas fa-calendar-alt"></i> ${ticket.date} à ${ticket.heure}</p>
                <p><i class="fas fa-users"></i> ${ticket.places} place(s) - ${ticket.classe}</p>
                <p><i class="fas fa-money-bill-wave"></i> ${ticket.prixTotal} FCFA</p>
                <div class="actions">
                    <button class="btn btn-details" data-id="${ticket.id}">
                        <i class="fas fa-eye"></i> Détails
                    </button>
                    ${ticket.statut === 'confirmé' ? `
                    <button class="btn btn-annuler" data-id="${ticket.id}">
                        <i class="fas fa-times"></i> Annuler
                    </button>
                    ` : ''}
                    <button class="btn btn-imprimer" data-id="${ticket.id}">
                        <i class="fas fa-print"></i> Imprimer
                    </button>
                </div>
            `;
            
            ticketsContainer.appendChild(ticketElement);
        });
        
        // Ajouter les événements pour les boutons
        document.querySelectorAll('.btn-annuler').forEach(btn => {
            btn.addEventListener('click', function() {
                const ticketId = parseInt(this.getAttribute('data-id'));
                annulerTicket(ticketId);
            });
        });
        
        document.querySelectorAll('.btn-imprimer').forEach(btn => {
            btn.addEventListener('click', function() {
                const ticketId = parseInt(this.getAttribute('data-id'));
                imprimerTicket(ticketId);
            });
        });
        
        document.querySelectorAll('.btn-details').forEach(btn => {
            btn.addEventListener('click', function() {
                const ticketId = parseInt(this.getAttribute('data-id'));
                showTicketDetails(ticketId);
            });
        });
    }
    
    // Recherche et filtrage des tickets
    document.getElementById('searchTickets').addEventListener('input', loadTickets);
    document.getElementById('filterStatus').addEventListener('change', loadTickets);
    
    // Fonction pour annuler un ticket
    function annulerTicket(ticketId) {
        const tickets = JSON.parse(localStorage.getItem('tickets'));
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        
        if (ticketIndex !== -1) {
            tickets[ticketIndex].statut = 'annulé';
            localStorage.setItem('tickets', JSON.stringify(tickets));
            loadTickets();
            showAlert('success', 'Ticket annulé avec succès');
        }
    }
    
    // Fonction pour imprimer un ticket
    function imprimerTicket(ticketId) {
        const tickets = JSON.parse(localStorage.getItem('tickets'));
        const ticket = tickets.find(t => t.id === ticketId);
        
        if (ticket) {
            const printContent = `
                <div class="ticket-print">
                    <div class="print-header">
                        <img src="logo_sotral.jpeg" alt="Logo SOTRAL" class="print-logo">
                        <h1>SOTRAL TOGO</h1>
                        <h2>Ticket de Bus</h2>
                    </div>
                    
                    <div class="print-details">
                        <div class="detail-row">
                            <span class="detail-label">N° Ticket:</span>
                            <span class="detail-value">#${ticket.id}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Passager:</span>
                            <span class="detail-value">${ticket.nom}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Trajet:</span>
                            <span class="detail-value">${ticket.depart} → ${ticket.arrivee}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Date:</span>
                            <span class="detail-value">${ticket.date} à ${ticket.heure}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Classe:</span>
                            <span class="detail-value">${ticket.classe}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Places:</span>
                            <span class="detail-value">${ticket.places}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Prix:</span>
                            <span class="detail-value">${ticket.prixTotal} FCFA</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Statut:</span>
                            <span class="detail-value status-${ticket.statut}">${ticket.statut}</span>
                        </div>
                    </div>
                    
                    <div class="print-barcode">
                        <div class="barcode">▮ ▮ ▮ ▮ ▮ ▮ ▮ ▮ ▮ ▮</div>
                        <div class="barcode-number">${ticket.id}</div>
                    </div>
                    
                    <div class="print-footer">
                        <p>Merci de voyager avec SOTRAL TOGO</p>
                        <p>Réservé le: ${ticket.dateReservation}</p>
                    </div>
                </div>
            `;
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Ticket SOTRAL #${ticket.id}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                            .ticket-print { max-width: 500px; margin: 0 auto; border: 2px solid #006747; padding: 20px; }
                            .print-header { text-align: center; margin-bottom: 20px; }
                            .print-logo { height: 60px; margin-bottom: 10px; }
                            .print-header h1 { color: #006747; margin: 5px 0; font-size: 24px; }
                            .print-header h2 { margin: 5px 0; font-size: 20px; }
                            .print-details { margin: 20px 0; }
                            .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed #ddd; }
                            .detail-label { font-weight: bold; color: #555; }
                            .print-barcode { text-align: center; margin: 30px 0; }
                            .barcode { letter-spacing: 5px; font-size: 24px; }
                            .barcode-number { letter-spacing: 2px; margin-top: 5px; }
                            .print-footer { text-align: center; margin-top: 20px; font-size: 14px; color: #666; }
                            .status-confirmé { color: #155724; }
                            .status-annulé { color: #721c24; }
                            .status-utilisé { color: #383d41; }
                            @media print {
                                body { padding: 0; }
                                .ticket-print { border: none; padding: 10px; }
                            }
                        </style>
                    </head>
                    <body>
                        ${printContent}
                        <script>
                            window.onload = function() { 
                                window.print(); 
                                setTimeout(function() { window.close(); }, 1000); 
                            }
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    }
    
    // Fonction pour afficher les détails d'un ticket dans un modal
    function showTicketDetails(ticketId) {
        const tickets = JSON.parse(localStorage.getItem('tickets'));
        const ticket = tickets.find(t => t.id === ticketId);
        
        if (ticket) {
            const modalContent = `
                <h2>Détails du Ticket #${ticket.id}</h2>
                <div class="ticket-details">
                    <div class="detail-item">
                        <span class="detail-label">Passager:</span>
                        <span class="detail-value">${ticket.nom}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Trajet:</span>
                        <span class="detail-value">${ticket.depart} → ${ticket.arrivee}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Date et heure:</span>
                        <span class="detail-value">${ticket.date} à ${ticket.heure}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Classe:</span>
                        <span class="detail-value">${ticket.classe}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Nombre de places:</span>
                        <span class="detail-value">${ticket.places}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Distance:</span>
                        <span class="detail-value">${ticket.distance} km</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Prix unitaire:</span>
                        <span class="detail-value">${ticket.prixUnitaire} FCFA</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Prix total:</span>
                        <span class="detail-value">${ticket.prixTotal} FCFA</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Statut:</span>
                        <span class="detail-value status-${ticket.statut}">${ticket.statut}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Date de réservation:</span>
                        <span class="detail-value">${ticket.dateReservation}</span>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-modal btn-print" data-id="${ticket.id}">
                        <i class="fas fa-print"></i> Imprimer
                    </button>
                    ${ticket.statut === 'confirmé' ? `
                    <button class="btn-modal btn-cancel" data-id="${ticket.id}">
                        <i class="fas fa-times"></i> Annuler
                    </button>
                    ` : ''}
                    <button class="btn-modal btn-close">
                        <i class="fas fa-times"></i> Fermer
                    </button>
                </div>
            `;
            
            document.getElementById('ticketModalContent').innerHTML = modalContent;
            openModal('ticketModal');
            
            document.querySelector('.btn-print')?.addEventListener('click', function() {
                imprimerTicket(ticketId);
            });
            
            document.querySelector('.btn-cancel')?.addEventListener('click', function() {
                annulerTicket(ticketId);
                closeModal('ticketModal');
            });
            
            document.querySelector('.btn-close').addEventListener('click', function() {
                closeModal('ticketModal');
            });
        }
    }
    
    // Fonctions pour gérer les modals
    function openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Fermer les modals en cliquant en dehors
    window.addEventListener('click', function(event) {
        if (event.target.className === 'modal') {
            event.target.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Fermer les modals avec le bouton de fermeture
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    });
    
    // Gestion des modals de connexion et d'inscription
    document.getElementById('loginBtn').addEventListener('click', function() {
        openModal('loginModal');
    });
    
    document.getElementById('registerBtn').addEventListener('click', function() {
        openModal('registerModal');
    });
    
    // Formulaire de connexion
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        showAlert('success', 'Connexion réussie (simulation)');
        closeModal('loginModal');
    });
    
    // Formulaire d'inscription
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        
        if (password !== confirmPassword) {
            showAlert('error', 'Les mots de passe ne correspondent pas');
            return;
        }
        
        showAlert('success', 'Inscription réussie! Vous pouvez maintenant vous connecter.');
        closeModal('registerModal');
    });
    
    // Fonction pour afficher des messages d'alerte
    function showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} animate__animated animate__fadeInDown`;
        alertDiv.textContent = message;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.classList.add('animate__fadeOutUp');
            setTimeout(() => alertDiv.remove(), 500);
        }, 3000);
    }
    
    // Style pour les alertes
    const alertStyle = document.createElement('style');
    alertStyle.textContent = `
        .alert {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 25px;
            border-radius: 5px;
            color: white;
            font-weight: 600;
            z-index: 1100;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
        }
        .alert-success {
            background-color: #28a745;
        }
        .alert-error {
            background-color: #dc3545;
        }
    `;
    document.head.appendChild(alertStyle);
    
    // Charger les horaires
    function loadHoraires() {
        const horaires = [
            { depart: 'Lomé', arrivee: 'Kara', heures: ['06:00', '08:00', '12:00', '16:00', '18:00'] },
            { depart: 'Lomé', arrivee: 'Sokodé', heures: ['06:30', '09:00', '13:00', '15:30'] },
            { depart: 'Lomé', arrivee: 'Atakpamé', heures: ['07:00', '10:00', '14:00', '17:00'] },
            { depart: 'Kara', arrivee: 'Lomé', heures: ['05:00', '07:00', '11:00', '15:00', '17:00'] },
            { depart: 'Sokodé', arrivee: 'Lomé', heures: ['06:00', '08:30', '12:30', '15:00'] },
            { depart: 'Atakpamé', arrivee: 'Lomé', heures: ['06:00', '09:00', '13:00', '16:00'] }
        ];
        
        let horairesHTML = '<div class="schedule-tabs">';
        
        const villesDepart = [...new Set(horaires.map(h => h.depart))];
        villesDepart.forEach((ville, index) => {
            horairesHTML += `<button class="tab-btn ${index === 0 ? 'active' : ''}" data-ville="${ville}">${ville}</button>`;
        });
        
        horairesHTML += '</div><div class="schedule-content">';
        
        villesDepart.forEach((ville, index) => {
            const horairesVille = horaires.filter(h => h.depart === ville);
            
            horairesHTML += `<div class="tab-content ${index === 0 ? 'active' : ''}" data-ville="${ville}">`;
            horairesHTML += `<h3>Départs de ${ville}</h3>`;
            
            horairesVille.forEach(horaire => {
                horairesHTML += `
                    <div class="schedule-item">
                        <div class="schedule-route">${horaire.depart} → ${horaire.arrivee}</div>
                        <div class="schedule-times">
                            ${horaire.heures.map(heure => `<span class="time-badge">${heure}</span>`).join('')}
                        </div>
                    </div>
                `;
            });
            
            horairesHTML += '</div>';
        });
        
        horairesHTML += '</div>';
        
        document.querySelector('.schedule-container').innerHTML = horairesHTML;
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const ville = this.getAttribute('data-ville');
                
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                    if (content.getAttribute('data-ville') === ville) {
                        content.classList.add('active');
                    }
                });
            });
        });
    }
    
    // Charger les tarifs
    function loadTarifs() {
        const pricingHTML = `
            <div class="pricing-cards">
                <div class="pricing-card">
                    <h3>Économique</h3>
                    <div class="price">${tarifs.Economique} FCFA/km</div>
                    <ul class="features">
                        <li><i class="fas fa-check"></i> Sièges standard</li>
                        <li><i class="fas fa-check"></i> Climatisation</li>
                        <li><i class="fas fa-check"></i> Bagage 20kg inclus</li>
                        <li><i class="fas fa-times"></i> Wi-Fi non disponible</li>
                    </ul>
                </div>
                <div class="pricing-card featured">
                    <h3>Confort</h3>
                    <div class="price">${tarifs.Confort} FCFA/km</div>
                    <ul class="features">
                        <li><i class="fas fa-check"></i> Sièges plus larges</li>
                        <li><i class="fas fa-check"></i> Climatisation</li>
                        <li><i class="fas fa-check"></i> Bagage 30kg inclus</li>
                        <li><i class="fas fa-check"></i> Wi-Fi disponible</li>
                    </ul>
                </div>
                <div class="pricing-card">
                    <h3>VIP</h3>
                    <div class="price">${tarifs.VIP} FCFA/km</div>
                    <ul class="features">
                        <li><i class="fas fa-check"></i> Sièges spacieux</li>
                        <li><i class="fas fa-check"></i> Climatisation</li>
                        <li><i class="fas fa-check"></i> Bagage 40kg inclus</li>
                        <li><i class="fas fa-check"></i> Wi-Fi haut débit</li>
                        <li><i class="fas fa-check"></i> Collation offerte</li>
                    </ul>
                </div>
            </div>
            <div class="pricing-example">
                <h3>Exemple de calcul</h3>
                <p>Pour un trajet Lomé-Kara (413 km):</p>
                <ul>
                    <li>Économique: 413 km × ${tarifs.Economique} FCFA = ${413 * tarifs.Economique} FCFA</li>
                    <li>Confort: 413 km × ${tarifs.Confort} FCFA = ${413 * tarifs.Confort} FCFA</li>
                    <li>VIP: 413 km × ${tarifs.VIP} FCFA = ${413 * tarifs.VIP} FCFA</li>
                </ul>
            </div>
        `;
        
        document.querySelector('.pricing-container').innerHTML = pricingHTML;
    }
    
    // Charger la section contact
    function loadContact() {
        const contactHTML = `
            <div class="contact-info">
                <div class="contact-method">
                    <i class="fas fa-phone-alt"></i>
                    <h3>Téléphone</h3>
                    <p>+228 22 21 20 19</p>
                    <p>Service client disponible 24h/24</p>
                </div>
                <div class="contact-method">
                    <i class="fas fa-envelope"></i>
                    <h3>Email</h3>
                    <p>contact@sotral.tg</p>
                    <p>Réponse sous 24 heures</p>
                </div>
                <div class="contact-method">
                    <i class="fas fa-map-marker-alt"></i>
                    <h3>Adresse</h3>
                    <p>Avenue de la Libération</p>
                    <p>Lomé, Togo</p>
                </div>
            </div>
            <form id="contactForm" class="contact-form">
                <h3>Envoyez-nous un message</h3>
                <div class="form-group">
                    <label for="contactName">Nom complet:</label>
                    <input type="text" id="contactName" required>
                </div>
                <div class="form-group">
                    <label for="contactEmail">Email:</label>
                    <input type="email" id="contactEmail" required>
                </div>
                <div class="form-group">
                    <label for="contactSubject">Sujet:</label>
                    <input type="text" id="contactSubject" required>
                </div>
                <div class="form-group">
                    <label for="contactMessage">Message:</label>
                    <textarea id="contactMessage" rows="5" required></textarea>
                </div>
                <button type="submit" class="btn-contact">Envoyer</button>
            </form>
        `;
        
        document.querySelector('.contact-container').innerHTML = contactHTML;
        
        document.getElementById('contactForm')?.addEventListener('submit', function(e) {
            e.preventDefault();
            showAlert('success', 'Votre message a été envoyé. Nous vous répondrons bientôt!');
            this.reset();
        });
    }
    
    // Définir la date minimale (aujourd'hui)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').setAttribute('min', today);
    
    // Empêcher la sélection de dates passées
    document.getElementById('date').addEventListener('input', function() {
        const selectedDate = new Date(this.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            this.value = today.toISOString().split('T')[0];
            showAlert('error', 'Vous ne pouvez pas sélectionner une date passée');
        }
    });
    
    // Initialiser l'affichage de la route si des valeurs sont déjà sélectionnées
    if (document.getElementById('depart').value && document.getElementById('arrivee').value) {
        updateRouteInfo();
    }
});