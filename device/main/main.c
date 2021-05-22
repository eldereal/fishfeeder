#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <memory.h>
#include <netdb.h>
#include <sys/socket.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_system.h"
#include "esp_spi_flash.h"
#include "driver/gpio.h"
#include "driver/hw_timer.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_spiffs.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_smartconfig.h"
#include "smartconfig_ack.h"
#include "esp_md5.h"


#define TAG __FUNCTION__
#define SERVER "192.168.31.151"
#define PORT "23106"
#define DEVICE "1000"
#define KEY "3I4BVzh78jdo&iv%"

typedef struct {
    char wifi;
    char ssid[33];
    char pwd[65];
    char forceInit;
} conf_t;

int focuser_gpio_nums[4] = {
    GPIO_NUM_15,
    GPIO_NUM_13,
    GPIO_NUM_12,
    GPIO_NUM_14
};

int led_gpio_num = GPIO_NUM_16;

bool focuser_step_config[][4] = {
    { 1, 0, 0, 0 },
    { 1, 1, 0, 0 },
    { 0, 1, 0, 0 },
    { 0, 1, 1, 0 },
    { 0, 0, 1, 0 },
    { 0, 0, 1, 1 },
    { 0, 0, 0, 1 },
    { 1, 0, 0, 1 }
};

uint32_t focuser_step;
uint32_t focuser_target_step;

void focuser_timer_listener(void* args) {
    if (focuser_step > focuser_target_step) {
        focuser_step --;
    } else if (focuser_step < focuser_target_step)  {
        focuser_step ++;
    } else {//reach target
        for (int i = 0; i < 4; i++) {            
            ESP_ERROR_CHECK(gpio_set_level(focuser_gpio_nums[i], 0));
        }
        // ESP_ERROR_CHECK(esp_timer_stop(focuser_timer));
        return;
    }
    uint32_t index = focuser_step % 8;
    bool *output = focuser_step_config[index];
    for (int i = 0; i < 4; i++) {            
        ESP_ERROR_CHECK(gpio_set_level(focuser_gpio_nums[i], output[i]));
    }
}

int32_t currentTimeSeconds(){
    return xTaskGetTickCount() / configTICK_RATE_HZ;
}

void focuser_move(int32_t steps) {
    focuser_target_step += steps;
    // ESP_ERROR_CHECK(esp_timer_start_periodic(focuser_timer, 1000));
}

void http_flash_error() {
    for (int i = 0; i < 3; i++)
    {
        gpio_set_level(led_gpio_num, 0);
        vTaskDelay(100 / portTICK_PERIOD_MS);
        gpio_set_level(led_gpio_num, 1);
        vTaskDelay(100 / portTICK_PERIOD_MS);
    }
}

esp_err_t request(
    const char* method,
    const char* url,
    char* resp
) {
    const struct addrinfo hints = {
        .ai_family = AF_INET,
        .ai_socktype = SOCK_STREAM,
    };
    struct addrinfo *res;
    struct in_addr *addr;
    int s, r;
    int err;
    char buffer[1024];
    ESP_LOGI(TAG, "%s %s", method, url);
    err = getaddrinfo(SERVER, PORT, &hints, &res);
    if (err != 0 || res == NULL) {
        ESP_LOGE(TAG, "DNS lookup failed err=%d res=%p", err, res);
        return ESP_FAIL;
    }
    addr = &((struct sockaddr_in *)res->ai_addr)->sin_addr;
    ESP_LOGI(TAG, "DNS lookup succeeded. IP=%s", inet_ntoa(*addr));

    s = socket(res->ai_family, res->ai_socktype, 0);
    if(s < 0) {
        ESP_LOGE(TAG, "Failed to allocate socket.");
        freeaddrinfo(res);
        return ESP_FAIL;
    }
    ESP_LOGI(TAG, "allocated socket");
    if(connect(s, res->ai_addr, res->ai_addrlen) != 0) {
        ESP_LOGE(TAG, "socket connect failed errno=%d", errno);
        close(s);
        freeaddrinfo(res);
        return ESP_FAIL;
    }
    ESP_LOGI(TAG, "connected");
    freeaddrinfo(res);

    sprintf(buffer, "%s %s HTTP/1.0\r\n"
        "Host: "SERVER":"PORT"\r\n"
        "User-Agent: esp-idf/1.0 esp32\r\n"
        "\r\n", method, url);

    if (write(s, buffer, strlen(buffer)) < 0) {
        ESP_LOGE(TAG, "socket send failed");
        close(s);
        return ESP_FAIL;
    }
    ESP_LOGI(TAG, "socket send success");
    struct timeval receiving_timeout;
    receiving_timeout.tv_sec = 5;
    receiving_timeout.tv_usec = 0;
    if (setsockopt(s, SOL_SOCKET, SO_RCVTIMEO, &receiving_timeout,
            sizeof(receiving_timeout)) < 0) {
        ESP_LOGE(TAG, "failed to set socket receiving timeout");
        close(s);
        return ESP_ERR_TIMEOUT;
    }
    ESP_LOGI(TAG, "set socket receiving timeout success");

    bzero(buffer, sizeof(buffer));
    r = read(s, buffer, sizeof(buffer)-1);
    if (r <= 0) {
        close(s);
        return ESP_ERR_INVALID_SIZE;
    }
    ESP_LOGI(TAG, "done reading from socket. Last read return=%d errno=%d", r, errno);
    close(s);

    char* ptr = buffer;
    if (memcmp(ptr, "HTTP/1.0 ", 9) != 0 && memcmp(ptr, "HTTP/1.1 ", 9) != 0) {
        ptr[8] = 0;
        ESP_LOGE(TAG, "... failed to parse response: invalid protocol %s", ptr);
        return ESP_ERR_INVALID_RESPONSE;
    }
    ptr += 9;
    if (memcmp(ptr, "200 ", 4) != 0) {
        char* n = ptr;
        while(*n != '\r') n++;
        *n = 0;
        ESP_LOGE(TAG, "response bad status code: %s", ptr);
        return ESP_ERR_INVALID_RESPONSE;
    }
    ptr = memmem(buffer, r, "\r\n\r\n", 4);
    if (ptr == NULL) {
        ESP_LOGE(TAG, "response no body");
        return ESP_ERR_INVALID_RESPONSE;
    }
    ptr += 4;
    int len = buffer + r - ptr;
    memcpy(resp, ptr, len);
    resp[len] = '\0';
    return ESP_OK;
}

void md5(char outbuf[32], const char* inbuf, unsigned int inbuf_size) {
    esp_md5_context_t ctx;
    esp_md5_init(&ctx);
    esp_md5_update(&ctx, (const unsigned char*)inbuf, inbuf_size);
    unsigned char digest[16];
    esp_md5_final(&ctx, digest);
    char* md5chars = "0123456789abcdef";
    for (int i = 0; i < 16; i++)
    {
        char c = digest[i];
        outbuf[2*i] = md5chars[c/16];
        outbuf[2*i+1] = md5chars[c%16];
    }
}

static conf_t sys_conf;
static const int CONNECTED_BIT = BIT0;
static const int DISCONNECTED_BIT = BIT1;
static const int ESPTOUCH_DONE_BIT = BIT2;
static const int ALL_BITS = CONNECTED_BIT | DISCONNECTED_BIT | ESPTOUCH_DONE_BIT;
static EventGroupHandle_t s_wifi_event_group;

static void http_get_task(void * _)
{
    int32_t sync_local_time = -61;
    int32_t sync_remote_time = 0;
    while(1) {
        char buf[64];
        char md5buf[33];
        int32_t local_time = currentTimeSeconds();
        if (local_time - sync_local_time > 60) {// sync time every minute
            if (request("GET", "/time", buf) != ESP_OK) {
                http_flash_error();
                vTaskDelay(3000 / portTICK_PERIOD_MS);
                continue;
            }
            sync_local_time = local_time;
            sync_remote_time = atoi(buf);
            ESP_LOGI(TAG, "sync local time %d, remote time %d", sync_local_time, sync_remote_time);
        }
        int32_t remote_time = local_time + (sync_remote_time - sync_local_time);
        sprintf(buf, "%s%s%d", DEVICE, KEY, remote_time);
        md5(md5buf, buf, strlen(buf));
        md5buf[32] = 0;//add null
        sprintf(buf, "/fetch?device="DEVICE"&ts=%d&sig=%s", remote_time, md5buf);
        if (request("POST", buf, buf) != ESP_OK) {
            http_flash_error();
            vTaskDelay(3000 / portTICK_PERIOD_MS);
            continue;
        }
        ESP_LOGI(TAG, "fetch result %s", buf);
        int steps = atoi(buf);
        if (steps > 0) {
            focuser_step = 512 * steps;
            focuser_target_step = 0;
        } else if (steps < 0) {
            focuser_target_step = 512 * steps;
            focuser_step = 0;
        }
        vTaskDelay(1000 / portTICK_PERIOD_MS);
        ESP_LOGI(TAG, "Starting again!");
    }
}

static void smartconfig_example_task(void* parm)
{
    EventBits_t uxBits;
    ESP_ERROR_CHECK(esp_smartconfig_set_type(SC_TYPE_ESPTOUCH_AIRKISS));
    smartconfig_start_config_t cfg = SMARTCONFIG_START_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_smartconfig_start(&cfg));
    int error_count = 0;
    while (1) {
        uxBits = xEventGroupWaitBits(s_wifi_event_group, ALL_BITS, true, false, portMAX_DELAY);

        if (uxBits & CONNECTED_BIT) {
            ESP_LOGI(TAG, "WiFi Connected to ap");
        }

        if (uxBits & ESPTOUCH_DONE_BIT) {
            ESP_LOGI(TAG, "smartconfig over");
            esp_smartconfig_stop();
            FILE* f = fopen("/spiffs/state", "w");
            if (f == NULL) {
                ESP_LOGE(TAG, "Cannot save state");
                esp_restart();
            }
            if (fwrite(&sys_conf, sizeof(conf_t), 1, f) != 1) {
                ESP_LOGE(TAG, "Cannot write state");
                esp_restart();
            }
            fclose(f);
            esp_restart();
        }

        if (uxBits & DISCONNECTED_BIT) {
            error_count ++;
            if (error_count <= 3) {
                ESP_LOGI(TAG, "smartconfig cannot connect to wifi, retry %d", error_count);
                ESP_ERROR_CHECK(esp_wifi_connect());
            } else {
                ESP_LOGI(TAG, "smartconfig failed after %d retries", error_count - 1);
                esp_smartconfig_stop();
                vTaskDelay(1000 / portTICK_PERIOD_MS);
                ESP_ERROR_CHECK(esp_smartconfig_start(&cfg));
                error_count = 0;
            }
        }
    }
}

static void wifi_event_task(void *arg) {
    EventBits_t uxBits;
    ESP_ERROR_CHECK(esp_wifi_connect());
    while (1) {
        uxBits = xEventGroupWaitBits(s_wifi_event_group, CONNECTED_BIT | DISCONNECTED_BIT, true, false, portMAX_DELAY);
        if (uxBits & CONNECTED_BIT) {
            ESP_LOGI(TAG, "WiFi Connected to ap");
            gpio_set_level(led_gpio_num, 1);
            xTaskCreate(&http_get_task, "http_get_task", 16384, NULL, 5, NULL);
        }
        if (uxBits & DISCONNECTED_BIT) {
            ESP_LOGI(TAG, "WiFi Disconnected");
            esp_restart();
        }
    }
}

static void event_handler(void* arg, esp_event_base_t event_base,
                          int32_t event_id, void* event_data)
{
    ESP_LOGI(TAG, "event_handler %s %d", event_base, event_id);
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        if (arg == NULL) {//airkiss
            xTaskCreate(smartconfig_example_task, "smartconfig_example_task", 4096, NULL, 3, NULL);
        } else {
            xTaskCreate(wifi_event_task, "wifi_event_task", 4096, NULL, 3, NULL);
        }
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        xEventGroupSetBits(s_wifi_event_group, DISCONNECTED_BIT);
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        xEventGroupSetBits(s_wifi_event_group, CONNECTED_BIT);
    } else if (event_base == SC_EVENT && event_id == SC_EVENT_SCAN_DONE) {
        ESP_LOGI(TAG, "Scan done");
    } else if (event_base == SC_EVENT && event_id == SC_EVENT_FOUND_CHANNEL) {
        ESP_LOGI(TAG, "Found channel");
    } else if (event_base == SC_EVENT && event_id == SC_EVENT_GOT_SSID_PSWD) {
        ESP_LOGI(TAG, "Got SSID and password");
        smartconfig_event_got_ssid_pswd_t* evt = (smartconfig_event_got_ssid_pswd_t*)event_data;
        wifi_config_t wifi_config;
        bzero(&wifi_config, sizeof(wifi_config_t));
        memcpy(wifi_config.sta.ssid, evt->ssid, sizeof(wifi_config.sta.ssid));
        memcpy(wifi_config.sta.password, evt->password, sizeof(wifi_config.sta.password));
        wifi_config.sta.bssid_set = evt->bssid_set;
        if (wifi_config.sta.bssid_set == true) {
            memcpy(wifi_config.sta.bssid, evt->bssid, sizeof(wifi_config.sta.bssid));
        }
        bzero(&sys_conf, sizeof(conf_t));
        memcpy(sys_conf.ssid, evt->ssid, sizeof(sys_conf.ssid));
        memcpy(sys_conf.pwd, evt->password, sizeof(sys_conf.pwd));
        sys_conf.wifi = 1;
        sys_conf.forceInit = 0;
        ESP_LOGI(TAG, "SSID: %s", sys_conf.ssid);
        ESP_LOGI(TAG, "PASSWORD: %s", sys_conf.ssid);
        ESP_ERROR_CHECK(esp_wifi_disconnect());
        ESP_ERROR_CHECK(esp_wifi_set_config(ESP_IF_WIFI_STA, &wifi_config));
        ESP_ERROR_CHECK(esp_wifi_connect());
    } else if (event_base == SC_EVENT && event_id == SC_EVENT_SEND_ACK_DONE) {
        xEventGroupSetBits(s_wifi_event_group, ESPTOUCH_DONE_BIT);
    }
}

void wifi_task(void* arg) {
    gpio_set_level(led_gpio_num, 0);
    
    s_wifi_event_group = xEventGroupCreate();

    tcpip_adapter_init();

    ESP_ERROR_CHECK(esp_event_loop_create_default());

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &event_handler, &sys_conf));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &event_handler, &sys_conf));

    wifi_config_t wifi_config;

    bzero(&wifi_config, sizeof(wifi_config_t));
    memcpy(wifi_config.sta.ssid, sys_conf.ssid, sizeof(wifi_config.sta.ssid));
    memcpy(wifi_config.sta.password, sys_conf.pwd, sizeof(wifi_config.sta.password));
            
    /* Setting a password implies station will connect to all security modes including WEP/WPA.
        * However these modes are deprecated and not advisable to be used. Incase your Access point
        * doesn't support WPA2, these mode can be enabled by commenting below line */

    if (strlen((char *)wifi_config.sta.password)) {
        wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;
    }

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA) );
    ESP_ERROR_CHECK(esp_wifi_set_config(ESP_IF_WIFI_STA, &wifi_config) );
    ESP_ERROR_CHECK(esp_wifi_start() );
}

void airkiss_task(void* arg) {
    tcpip_adapter_init();
    s_wifi_event_group = xEventGroupCreate();

    ESP_ERROR_CHECK(esp_event_loop_create_default());

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();

    ESP_ERROR_CHECK(esp_wifi_init(&cfg));
    ESP_ERROR_CHECK(esp_wifi_set_ps(WIFI_PS_NONE));
    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &event_handler, NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &event_handler, NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(SC_EVENT, ESP_EVENT_ANY_ID, &event_handler, NULL));

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_start());
}

void airkiss_flash_led_task(void* arg) {
    while (1)
    {
        gpio_set_level(led_gpio_num, 0);
        vTaskDelay(500 / portTICK_PERIOD_MS);
        gpio_set_level(led_gpio_num, 1);
        vTaskDelay(500 / portTICK_PERIOD_MS);
    }
}

static EventGroupHandle_t gpio_evt_group = NULL;

static void gpio_isr_handler(void *arg)
{
    xEventGroupSetBits(gpio_evt_group, BIT0);
}

static void gpio_task_example(void *arg)
{
    while (1) {
        EventBits_t bits = xEventGroupWaitBits(gpio_evt_group, BIT0, true, false, portMAX_DELAY);
        if (bits == BIT0) {
            sys_conf.forceInit = 1;
            FILE* f = fopen("/spiffs/state", "w");
            if (f == NULL) {
                ESP_LOGE(TAG, "Cannot save state");
                esp_restart();
            }
            if (fwrite(&sys_conf, sizeof(conf_t), 1, f) != 1) {
                ESP_LOGE(TAG, "Cannot write state");
                esp_restart();
            }
            fclose(f);
            esp_restart();
        }
    }
}

void init_reset() {
    gpio_evt_group = xEventGroupCreate();
    gpio_config_t io_conf;
    io_conf.intr_type = GPIO_INTR_POSEDGE;
    io_conf.pin_bit_mask = GPIO_Pin_0;
    io_conf.mode = GPIO_MODE_INPUT;
    io_conf.pull_up_en = 1;
    gpio_config(&io_conf);
    gpio_set_intr_type(GPIO_NUM_0, GPIO_INTR_ANYEDGE);
    xTaskCreate(gpio_task_example, "gpio_task_example", 2048, NULL, 10, NULL);
    gpio_install_isr_service(0);
    gpio_isr_handler_add(GPIO_NUM_0, gpio_isr_handler, NULL);
}

void app_main()
{
    ESP_ERROR_CHECK(nvs_flash_init());
    
    gpio_config_t io_conf;
    io_conf.intr_type = GPIO_INTR_DISABLE;
    io_conf.mode = GPIO_MODE_OUTPUT;
    io_conf.pin_bit_mask = BIT(led_gpio_num);
    io_conf.pull_down_en = 0;
    io_conf.pull_up_en = 0;
    ESP_ERROR_CHECK(gpio_config(&io_conf));
    gpio_set_level(led_gpio_num, 1);

    ESP_LOGI(TAG, "Initializing Stepper");
    
    for (int i = 0; i < 4; i ++) {
        gpio_config_t conf;
        conf.pin_bit_mask = BIT(focuser_gpio_nums[i]);
        conf.mode = GPIO_MODE_OUTPUT;
        conf.intr_type = GPIO_INTR_DISABLE;
        conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
        conf.pull_up_en = GPIO_PULLUP_DISABLE;
        ESP_ERROR_CHECK(gpio_config(&conf));
        gpio_set_level(focuser_gpio_nums[i], 0);
    }
    
    ESP_ERROR_CHECK(hw_timer_init(focuser_timer_listener, NULL));
    ESP_ERROR_CHECK(hw_timer_alarm_us(1000, true));

    ESP_LOGI(TAG, "Initializing SPIFFS");
    
    esp_vfs_spiffs_conf_t spiff_conf = {
      .base_path = "/spiffs",
      .partition_label = NULL,
      .max_files = 5,
      .format_if_mount_failed = true
    };
    
    esp_err_t ret = esp_vfs_spiffs_register(&spiff_conf);

    if (ret != ESP_OK) {
        if (ret == ESP_FAIL) {
            ESP_LOGE(TAG, "Failed to mount or format filesystem");
        } else if (ret == ESP_ERR_NOT_FOUND) {
            ESP_LOGE(TAG, "Failed to find SPIFFS partition");
        } else {
            ESP_LOGE(TAG, "Failed to initialize SPIFFS (%s)", esp_err_to_name(ret));
        }
        goto err;
    }

    ESP_LOGI(TAG, "Opening file");
    
    memset(&sys_conf, 0, sizeof(conf_t));

    FILE* f = fopen("/spiffs/state", "r");
    if (f != NULL) {
        fread(&sys_conf, sizeof(conf_t), 1, f);
        fclose(f);    
    }
    if (!sys_conf.wifi) {
        ESP_LOGI(TAG, "Enter Airkiss mode");
        xTaskCreate(airkiss_flash_led_task, "airkiss_flash_led_task", 4096, NULL, 5, NULL);
        airkiss_task(NULL);
    } else if (sys_conf.forceInit) {
        FILE* f = fopen("/spiffs/state", "w");
        sys_conf.forceInit = false;
        if (f == NULL) {
            ESP_LOGE(TAG, "Cannot save state");
            esp_restart();
        }
        if (fwrite(&sys_conf, sizeof(conf_t), 1, f) != 1) {
            ESP_LOGE(TAG, "Cannot write state");
            esp_restart();
        }
        fclose(f);
        ESP_LOGI(TAG, "Enter Airkiss mode");
        xTaskCreate(airkiss_flash_led_task, "airkiss_flash_led_task", 4096, NULL, 5, NULL);
        airkiss_task(NULL);
    } else {
        init_reset();
        ESP_LOGI(TAG, "Enter WiFi mode");
        wifi_task(NULL);
    }
    
    return;
    err:
    vTaskDelay(1000 / portTICK_PERIOD_MS);
    esp_restart();
}
