CTFd.plugin.run((_CTFd) => {
    const $ = _CTFd.lib.$;
    
    // Définir les traductions pour le plugin geo_challenges
    const translations = {
        'en': {
            'click_map': 'Click on the map to place your marker. A blue circle indicates the tolerance zone.',
            'click_map_polygon': 'Click on the map to place your marker. Your answer is valid if the marker is placed inside the predefined answer zone.',
            'submit_location': 'Submit Location',
            'select_location_first': 'Please select a location on the map first.',
            'error_submitting': 'Error submitting challenge'
        },
        'fr': {
            'click_map': 'Cliquez sur la carte pour placer votre marqueur. Un cercle bleu indique la zone de tolérance.',
            'click_map_polygon': 'Cliquez sur la carte pour placer votre marqueur. Votre réponse est validée si le marqueur se trouve dans la zone de réponse prédéfinie.',
            'submit_location': 'Soumettre la position',
            'select_location_first': 'Veuillez d\'abord sélectionner un emplacement sur la carte.',
            'error_submitting': 'Erreur lors de la soumission du défi'
        },
        'es': {
            'click_map': 'Haga clic en el mapa para colocar su marcador. Un círculo azul indica la zona de tolerancia.',
            'click_map_polygon': 'Haga clic en el mapa para colocar su marcador. La respuesta es válida si el marcador se encuentra dentro de la zona de respuesta predefinida.',
            'submit_location': 'Enviar ubicación',
            'select_location_first': 'Por favor, seleccione primero una ubicación en el mapa.',
            'error_submitting': 'Error al enviar el desafío'
        },
        'ja': {
          'click_map': '地図上をクリックしてマーカーを置いてください。マーカーを置いた際の青い円は許容誤差範囲を示します。',
          'click_map_polygon': '地図上をクリックしてマーカーを置いてください。マーカーが事前に設定された回答ゾーン内にある場合、正解として判定されます。',
          'submit_location': 'Submit Location',
          'select_location_first': '地図上で座標を選択してください。',
          'error_submitting': '問題の提出中にエラーが発生しました。'
        }
    };
    
    // Charger la langue du CTFd depuis le cookie
    function getCurrentLanguage() {
        // Fonction pour lire un cookie par son nom
        function getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        }
        
        // Essayer de récupérer la langue depuis le cookie
        let ctfdLang = getCookie('language') || 'en';
        
        // Vérifier si la langue est supportée, sinon utiliser l'anglais
        if (!translations[ctfdLang]) {
            ctfdLang = 'en';
        }
        
        return ctfdLang;
    }
    
    // Fonction de traduction
    window.GeoChallenge = window.GeoChallenge || {};
    
    window.GeoChallenge.translate = function(key) {
        const lang = getCurrentLanguage();
        return translations[lang][key] || translations['en'][key] || key;
    };
    
    // Fonction pour appliquer les traductions aux éléments HTML
    window.GeoChallenge.applyTranslations = function() {
        $('#geo-submit').text(
            window.GeoChallenge.translate('submit_location')
        );

        // Adapter les instructions au type de réponse du challenge
        const polygonMode =
            $('#map-solve').attr('data-polygon-mode') === '1';

        const instructionKey = polygonMode
            ? 'click_map_polygon'
            : 'click_map';

        $('.map-instructions').text(
            window.GeoChallenge.translate(instructionKey)
        );
    };
    
    // Charger les traductions une fois que la page est prête
    $(document).on('shown.bs.modal', function (e) {
        // Attendre un peu pour s'assurer que le modal est complètement affiché
        setTimeout(function() {
            // Vérifier si c'est un challenge de type geo
            if ($('#map-solve').length) {
                window.GeoChallenge.applyTranslations();
            }
        }, 100);
    });
});
