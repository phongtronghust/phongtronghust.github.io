// Đổi từ định dạng giờ sử dụng trong dữ liệu sang xâu
// Giờ trong dữ liệu được lưu bằng số phút trôi qua từ 0h00 chia 5
// VD: 0h30 lưu là 6, 1h30 lưu là 18
function custom_time_to_string(time) {
    time *= 5;
    const hour = Math.floor(time / 60);
    const minute = time % 60;
    return (hour < 10 ? '0' : '') + hour + 'h' + (minute < 10 ? 0 : '') + minute;
}

// Kiểm tra tuần hiện tại có nằm trong danh sách tuần theo định dạng của trường không
// (8, '2-9, 11-18') = true, (10, '2-9, 11-18') = false
function is_week_in_week_string(week, week_string) {
    for (let sub_week_string of week_string.split(',')) {
        const split_sub_week = sub_week_string.toString().split('-');
        if (split_sub_week.length === 1 && parseInt(split_sub_week[0]) === week) return true;
        if (split_sub_week.length === 2 && parseInt(split_sub_week[0]) <= week && week <= parseInt(split_sub_week[1])) return true;
    }
    return false;
}

// Hàm trả về thứ, giờ và tuần hiện tại
function getCurrentDayTimeWeek() {
    const date = new Date();
    return [
        date.getDay() === 0 ? 6 : date.getDay() - 1,
        date.getHours(),
        date.getMinutes(),
        Math.floor((date.valueOf() - monday_first_week_ms)/604800000) + 1];
}

function getTimeString(hour, minute) {
    return (hour < 10 ? '0' : '') + hour + 'h' + (minute < 10 ? '0' : '') + minute;
}

// Hàm trả về thông tin các lớp hiện tại và lớp tiếp theo của một phòng tại một tuần, thứ và giờ cụ thể
// Nếu không có lớp hiện tại/tiếp theo thì giá trị tại đó là null
function get_information_of_room(room_id, day_of_week, time, week) {
    const room_today_data = data[room_id][day_of_week];
    let i, current = [], next = null;

    // Duyệt qua mọi lớp của phòng trong thứ hiện tại (được xếp theo thứ tự tăng dần thời gian bắt đầu)
    // Nếu lớp đang duyệt kết thúc rồi thì continue
    // Nếu chưa kết thúc nhưng cũng chưa bắt đầu thì hiện phòng đang rảnh
    // Còn lại, nếu đã bắt đầu nhưng chưa kết thúc thì là lớp đang học
    // Sau vòng lặp, biến i chỉ tới lớp ngay liền sau hoặc trỏ tới sau phần tử cuối
    for (i = 0; i < room_today_data.length; ++i) {
        if (time > room_today_data[i][3]) continue;
        if (time < room_today_data[i][2]) break;
        if (is_week_in_week_string(week, room_today_data[i][4])) {
            current.push(room_today_data[i]);
        }
    }

    // Tìm lớp tiếp theo
    for (; i < room_today_data.length; ++i) {
        if (is_week_in_week_string(week, room_today_data[i][4])) {
            next = room_today_data[i];
            break;
        }
    }

    if (current.length === 0) current = null;
    return [current, next];
}

function filter() {
    const text = document.getElementById("search_bar").value.toUpperCase();
    const list_items = list.getElementsByTagName("li");

    for (let i = 0; i < list_items.length; ++i) {
        list_items[i].style.display = list_items[i].innerText.toUpperCase().includes(text) ? "" : "none";
    }
}

const monday_first_week_ms = new Date("2024-09-02T00:00:00").valueOf();
const current_time_element = document.getElementById("current_time");
const list = document.getElementById("list");

const current_time_information = getCurrentDayTimeWeek();
current_time_element.innerHTML = `Thời gian: ${getTimeString(current_time_information[1], current_time_information[2])}, thứ ${current_time_information[0] + 2}, tuần ${current_time_information[3]}`;

for (let i = 0; i < rooms.length; ++i) {
    let time = current_time_information[1]*12 + current_time_information[2]/5;

    let current_course, next_course;
    [current_course, next_course] = get_information_of_room(i, current_time_information[0], time, current_time_information[3]);

    let child = document.createElement("li");

    let tag_html;
    if (current_course == null && next_course == null) {
        tag_html = '<span class="tag" style="background: gold;">Trống tới hết ngày</span>'
    } else if (current_course == null) {
        tag_html = '<span class="tag" style="background: lime;">Trống</span>'
    } else {
        tag_html = '<span class="tag" style="background: tomato;">Đang học</span>'
    }

    let current_course_html = "";
    if (current_course != null) {
        for (let course of current_course) {
            current_course_html += `<div style="margin-top: 16px; text-align: center;">${(course[0] + ` - ${subjects[course[1]][1]}`)}</div>`
            current_course_html += `<div style="display: flex;">${custom_time_to_string(course[2])} <span style="display: flex; flex: content; border-radius: 6px; border: 1px solid black; margin: 6px 12px 6px;"><span style="flex: ${(time-course[2])/(course[3] - course[2])}; border-radius: 6px; background: tomato;"></span></span> ${custom_time_to_string(course[3])}</div>`;
        }
    }

    let next_course_html = "<div style=\"margin-top: 16px; text-align: right;\"><strong>Tiếp theo:</strong> Không</div>";
    if (next_course != null) {
        next_course_html = `<div style="margin-top: 16px; text-align: right;"><strong>Tiếp theo:</strong> ${custom_time_to_string(next_course[2])}, lớp ${next_course[0]} <br> ${subjects[next_course[1]][1]}</div>`
    }

    child.innerHTML =
        `Phòng <strong>${rooms[i]}</strong> ${tag_html}
         ${current_course_html}
         ${next_course_html}`;
    list.appendChild(child);
}
