// 獲取推薦的資料
document.addEventListener('DOMContentLoaded', async function () {
    const response = await fetch('/train');
    const data = await response.json();
    const photoReferences = data[0];
    const restaurantNames = data[1];

    // 判斷是否已登入
    const isLoggedIn = restaurantNames && restaurantNames.length > 0;

    if (isLoggedIn) {
        // 如果已登入，更新推薦一、推薦二、推薦三
        updateSlidesAndInfo('discover_wrapper_1_photos', 'recommendation_desc_1', photoReferences.slice(0, 3), restaurantNames[0]);
        updateSlidesAndInfo('discover_wrapper_2_photos', 'recommendation_desc_2', photoReferences.slice(3, 6), restaurantNames[1]);
        updateSlidesAndInfo('discover_wrapper_3_photos', 'recommendation_desc_3', photoReferences.slice(6, 9), restaurantNames[2]);
    } else {
        // 如果未登入，顯示預設圖片
        setDefaultSlides('discover_wrapper_1_photos', 'recommendation_desc_1');
        setDefaultSlides('discover_wrapper_2_photos', 'recommendation_desc_2');
        setDefaultSlides('discover_wrapper_3_photos', 'recommendation_desc_3');
    }

    // 初始化Swiper
    initializeSwiper();
});

function updateSlidesAndInfo(wrapperId, descId, photoReferences, restaurant) {
    const wrapper = document.getElementById(wrapperId);
    const desc = document.getElementById(descId);

    wrapper.innerHTML = ''; // 清空內容
    photoReferences.forEach(photoReference => {
        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=4000&maxheight=6000&photoreference=${photoReference}&key=api_key`;
        const slide = document.createElement('div');
        slide.className = 'discover__card swiper-slide';
        slide.innerHTML = `<img src="${photoUrl}" alt="" class="discover__img">`;
        wrapper.appendChild(slide);
    });

    // 更新描述
    desc.innerHTML = `${restaurant.name} <br>${restaurant.address}<br>${restaurant.rating}/5.0`;
}

function setDefaultSlides(wrapperId, descId) {
    const wrapper = document.getElementById(wrapperId);
    const desc = document.getElementById(descId);

    const defaultImages = [
        "assets/img/taiwan_discover1.jpg",
        "assets/img/taiwan_discover2.jpg",
        "assets/img/taiwan_discover3.jpg"
    ];

    wrapper.innerHTML = ''; // 清空內容
    defaultImages.forEach(imgSrc => {
        const slide = document.createElement('div');
        slide.className = 'discover__card swiper-slide';
        slide.innerHTML = `<img src="${imgSrc}" alt="" class="discover__img">`;
        wrapper.appendChild(slide);
    });

    // 恢復預設描述
    desc.innerHTML = '餐廳 <br>名稱、地址、星數';
}

function initializeSwiper() {
    new Swiper('.swiper-container', {
        slidesPerView: 3,  // 確保每個視圖顯示三張圖片
        spaceBetween: 10,
        loop: true,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
    });
}

