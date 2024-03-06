let isSidebarOpen = false;


/* func to toggle the visibility of the sidebar + swap icons */
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar')
    const closed = document.querySelector('.closed')
    const opened = document.querySelector('.opened')

    isSidebarOpen = !isSidebarOpen;

    if (isSidebarOpen) {
        /* show sidebar */
        /*sidebar.style.display = "flex";*/

        /* hide closed, show opened */
        closed.style.display = "none"
        opened.style.display = "inline-block"



    } else {
        /* hide sidebar */
        /*sidebar.style.display = "none";*/

        /* show closed, hide opened */
        closed.style.display = "inline-block"
        opened.style.display = "none"

    }
    sidebar.classList.toggle('active');
}

