function Validator(options) {
    function getParent(element, selector) {
        while(element.parentElement) {
            if(element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }


    var selectorRules = {};

    // Hàm thực hiện validate
    function validate(inputElement, rule) {
        var errorMessage;
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
        // Lấy ra các rules của selector
        var rules = selectorRules[rule.selector];
        
        // Lặp qua từng rule và kiểm tra
        // Nếu có lỗi thì dừng việc kiểm tra
        for(var i = 0; i < rules.length; i++) {
            switch(inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    )
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            if(errorMessage) break;
        }
        
        if(errorMessage) {
            errorElement.innerText = errorMessage;
            formElement.querySelector(rule.selector).classList.add('invalid')
        } else {
            errorElement.innerText = '';
            formElement.querySelector(rule.selector).classList.remove('invalid')
        }

        return !errorMessage;
    }
    // Lấy ra element của form cần validate
    var formElement = document.querySelector(options.form);
    // 
    if(formElement) {

        // Khi submit form
        formElement.onsubmit = function(event) {
            event.preventDefault();

            var isFormValid = true;

            // Lặp qua từng rule và validate
            options.rules.forEach(function(rule) {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement, rule);
                if(!isValid) {
                    isFormValid = false;
                }
            });
            
            if(isFormValid) {
                
                // Trường hợp submit với javascript
                if(typeof options.onSubmit === 'function') {
                    var enableInput = formElement.querySelectorAll('[name]:not([disabled])');
        
                    var formValues = Array.from(enableInput).reduce(function(values, input) {
                        switch(input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector(`input[name=${input.name}]:checked`).value;
                                break;
                            case 'checkbox':
                                if(!input.matches(':checked')) {
                                    values[input.name] = [];
                                    return values;  
                                } 
                                if(!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value)
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;
                        }
                        return values;
                    }, {})              
                    options.onSubmit(formValues);
                }
                // Trường hợp submit với hành vi mặc định
                else {
                    formElement.submit();
                }
            }
        }


        // Lặp qua mỗi rule và xử lý(lắng nghe sự kiện blur, input, ...)
        options.rules.forEach(function(rule) {

            // Lưu lại các rules cho mỗi input
            if(Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            var inputElements = formElement.querySelectorAll(rule.selector);

            Array.from(inputElements).forEach(inputElement => {
                if(inputElement) {
                    // Xử lý khi blur khỏi input
                    inputElement.onblur = function() {
                        validate(inputElement, rule);
                    }
                    // Xử lý khi người dùng nhập vào input
                    inputElement.oninput = function() {
                        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
                        errorElement.innerText = '';
                        formElement.querySelector(rule.selector).classList.remove('invalid')
                    }


                }

            })
        })
    }
}


Validator.isRequired = function(selector, message = 'Vui lòng nhập trường này') {
    return {
        selector,
        test: function(value) {

            return value ? undefined : message
        }
    };
}

Validator.isEmail = function(selector, message = 'Trường này phải là email') {
    return {
        selector,
        test: function(value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : message;
        }
    }
}

Validator.minLength = function(selector, min, message = `Vui lòng nhập ít nhất ${min} kí tự`) {
    return {
        selector,
        test: function(value) {
            return value.length >= min ? undefined : message;
        }
    };
}

Validator.isConfirmed = function(selector, getConfirmValue, message = 'Giá trị nhập vào không chính xác') {
    return {
        selector,
        test: function(value) {
            return value === getConfirmValue() ? undefined : message;
        }
    }
}