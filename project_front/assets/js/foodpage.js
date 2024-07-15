const buttons = document.querySelectorAll('.button_search');
const container = document.querySelector('.container_restaurant');
let map;
let markers = [];

// 搜尋欄查詢資料庫
document.querySelector('#search-form').addEventListener('submit', async function (event) {
    event.preventDefault(); // 防止表單提交導致頁面重載
    const searchTerm = this.elements.term.value;
    if (searchTerm.length > 0) {
        const response = await fetch(`/search?term=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        displayResults(data.table);
        updateMapMarkers(data.table);
    } else {
        clearResults();
        fetchRestaurantsAndUpdateUI('all');
    }
});

// Toggle heart icon and update favorite status
function toggleHeart(element, restaurantName) {
    element.classList.toggle('liked');
    fetch('/toggleFavorite', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ restaurantName })
    })
    .then(response => response.json())
    .catch(error => {
        console.error('Error:', error);
    });
}

// Check if user is logged in
function isUserLoggedIn() {
    return new Promise((resolve, reject) => {
        fetch("/check", {
            method: "GET",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        })
        .then(response => response.json())
        .then(data => {
            resolve(data.check === "Yes");
        })
        .catch(error => {
            reject('發生錯誤，請稍後再試。');
        });
    });
}

// Get favorite restaurants
function getFavoriteRestaurants() {
    return new Promise((resolve, reject) => {
        fetch('/checkrestaurant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                reject(data.error);
            } else {
                resolve(data.favorites.map(fav => fav.trim())); // 修剪字符串
            }
        })
        .catch(error => {
            reject('Error fetching favorite restaurants');
        });
    });
}

// Display restaurant results and add event listeners
function displayResults(restaurants) {
    //TEST//
    const container = document.querySelector('.container_restaurant');
    const restaurantCountElement = document.getElementById('restaurantNum');
    
    container.innerHTML = ''; // 清空現有的餐廳列表
    restaurantCountElement.textContent = `${restaurants.length}家`; // 更新餐廳數量





    // container.innerHTML = ''; // Clear existing restaurant list

    restaurants.forEach(restaurant => {
        const itemRestaurant = document.createElement('div');
        itemRestaurant.className = 'item_restaurant button_restaurant';
        itemRestaurant.dataset.restaurant = restaurant.name.trim(); // 修剪字符串
        itemRestaurant.innerHTML = `
            <a href="#restaurant_info"><h2>${restaurant.name}</h2></a>
            <p>${restaurant.address}</p>
            <div class="rating">${'★'.repeat(restaurant.rating)}${'☆'.repeat(5 - restaurant.rating)}</div>
            <span class="heart">&#10084;</span>
        `;
        container.appendChild(itemRestaurant);

        const heart = itemRestaurant.querySelector('.heart');
        heart.addEventListener('click', async (event) => {
            event.stopPropagation();

            try {
                const loggedIn = await isUserLoggedIn();
                if (loggedIn) {
                    toggleHeart(heart, restaurant.name.trim()); // 修剪字符串
                } else {
                    alert('請先登入才能點擊愛心');
                }
            } catch (error) {
                alert(error);
            }
        });

        itemRestaurant.addEventListener('click', () => {
            document.querySelectorAll('.button_restaurant').forEach(btn => btn.classList.remove('clicked'));
            itemRestaurant.classList.add('clicked');
            showRestaurantInfo(restaurant);
        });
    });

    // 在餐灣聽列表更新後亮起愛心
    getFavoriteRestaurants().then(favorites => {
        console.log('Favorites:', favorites); // 调试信息
        favorites.forEach(restaurantName => {
            const heartElement = document.querySelector(`[data-restaurant="${restaurantName}"] .heart`);
            if (heartElement) {
                heartElement.classList.add('liked');
            } else {
                console.warn(`Restaurant not found: ${restaurantName}`); // 调试信息
            }
        });
    }).catch(error => {
        console.error('Error:', error);
    });
}

// Fetch and update restaurant list
function fetchRestaurantsAndUpdateUI(category) {
    fetch(`/test_restaurants?category=${category}`)
        .then(response => response.json())
        .then(data => {
            displayResults(data.table); // 直接调用 displayResults
            updateMapMarkers(data.table); // 更新地圖標示
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Initialize page and fetch restaurants
window.addEventListener('load', () => {
    initMap(); // 確保地圖初始化
    const allCategoriesButton = document.getElementById('all_class');
    if (allCategoriesButton) {
        allCategoriesButton.click();
    }
});

// 點擊分類的顏色滯留效果
buttons.forEach(button => {
    button.addEventListener('click', function () {
        buttons.forEach(btn => btn.classList.remove('clicked'));
        this.classList.add('clicked');
        const category = this.id;
        fetchRestaurantsAndUpdateUI(category === "all_class" ? "all" : category);
    });
});

function showRestaurantInfo(restaurant) {
    const infoContainer = document.querySelector('.section_restaurant_information');
    const goodReviews = JSON.parse(restaurant.good_reviews);
    const badReviews = JSON.parse(restaurant.bad_reviews);
    const photos = JSON.parse(restaurant.photos);

    const photoReferences = photos.map(photo => photo.photo_reference);

    const formatReviews = (reviews) => {
        return reviews.map(review => `<p>．${review.text.replace(/\n/g, '<br>')}</p>`).join('');
    };

    const goodReviewsHtml = formatReviews(goodReviews);
    const badReviewsHtml = formatReviews(badReviews);

    infoContainer.innerHTML = `
        <div class='container grid restaurant_info'>
            <h2>${restaurant.name}</h2>
            <p>${restaurant.address}</p>
            <h2>營業時間</h2>
            <p>${JSON.parse(restaurant.opening_hours).join('<br>')}</p>
            <h2>電話</h2>
            <p>${restaurant.phone_number}</p>
            <h2>照片</h2>
            <img src="https://maps.googleapis.com/maps/api/place/photo?maxwidth=4000&maxheight=6000&photoreference=${photoReferences[0]}&key=your_api_key">
            <div class="flex_comment">
                <div class="container grid comment-wrapper">
                <h2 class="comment__title">好評</h2>
                ${goodReviewsHtml}
                </div>
                <div class="container grid comment-wrapper">
                <h2 class="comment__title">負評</h2>
                ${badReviewsHtml}
                </div>
            </div>
        </div>
    `;

    const headerHeight = document.getElementById('header').offsetHeight;
    const targetOffset = infoContainer.offsetTop - headerHeight;
    window.scrollTo({
        top: targetOffset,
        behavior: 'smooth' // 平滑滾動
    });
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: { lat: 25.033964, lng: 121.564468 },
        mapTypeId: 'roadmap',
        disableDefaultUI: false
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            map.setCenter(userLocation);

            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({ 'location': userLocation }, function (results, status) {
                if (status === 'OK') {
                    if (results[0]) {
                        var fullAddress = results[0].formatted_address;
                        var shortAddress = extractDistrict(fullAddress);
                        document.getElementById('userLocationInfo').innerText = shortAddress;
                    } else {
                        document.getElementById('userLocationInfo').innerText = "無法取得使用者位置";
                    }
                } else {
                    document.getElementById('userLocationInfo').innerText = "無法取得使用者位置";
                }
            });
        }, function () {
            handleLocationError(true, map.getCenter());
        });
    } else {
        handleLocationError(false, map.getCenter());
    }
}

function updateMapMarkers(restaurants) {
    clearMarkers();
    restaurants.forEach(restaurant => {
        var marker = new google.maps.Marker({
            position: { lat: parseFloat(restaurant.latitude), lng: parseFloat(restaurant.longitude) },
            map: map,
            title: restaurant.name,
            icon: getIcon(restaurant.class)
        });
        markers.push(marker);

        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="min-width: 200px; border-radius: 8px; padding: 10px; ">
                    <h3 style="margin: 0; padding: 0; font-size: 16px; font-weight: bold;">${restaurant.name}</h3>
                </div>
            `
        });

        marker.addListener('mouseover', () => {
            infoWindow.open(map, marker);
        });

        marker.addListener('mouseout', () => {
            infoWindow.close();
        });

        marker.addListener('click', () => {
            showRestaurantInfo(restaurant);
        });
    });
}

function getIcon(className) {
    let iconUrl;
    switch (className) {
        case 'bar':
            iconUrl = 'https://cdn-icons-png.flaticon.com/128/2195/2195057.png';
            break;
        case 'vegan':
            iconUrl = 'https://cdn-icons-png.flaticon.com/128/5011/5011047.png';
            break;
        case 'chinese':
            iconUrl = 'https://cdn-icons-png.flaticon.com/128/3448/3448598.png';
            break;
        case 'teatime':
            iconUrl = 'https://cdn-icons-png.flaticon.com/128/2007/2007864.png';
            break;
        default:
            iconUrl = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
            break;
    }
    return {
        url: iconUrl,
        scaledSize: new google.maps.Size(50, 50)
    };
}

function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

function extractDistrict(address) {
    var regex = /台北市.*區/;
    var match = address.match(regex);
    return match ? match[0] : address;
}

function handleLocationError(browserHasGeolocation, pos) {
    var infoWindow = new google.maps.InfoWindow;
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: 地理定位服務失敗' :
        'Error: 您的瀏覽器不支援地理定位功能');
    infoWindow.open(map);
}

// 返回頁面頂端
const backToTopButton = document.getElementById('back-to-top');

window.addEventListener('scroll', function () {
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;

    if (scrollPosition > 300) {
        backToTopButton.classList.add('show');
    } else {
        backToTopButton.classList.remove('show');
    }
});

backToTopButton.addEventListener('click', function () {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});
