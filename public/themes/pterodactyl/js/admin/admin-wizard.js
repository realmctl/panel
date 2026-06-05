(function ($) {
    window.initAdminWizard = function (options) {
        const TOTAL_STEPS = options.totalSteps;
        const stepFields = options.stepFields;
        const $root = $(options.root);
        const $form = $(options.form);
        const $backBtn = $(options.backBtn);
        const $nextBtn = $(options.nextBtn);
        const $submitBtn = $(options.submitBtn);
        const onStepShown = options.onStepShown || function () {};

        if (!$root.length || $root.data('wizardInitialized')) {
            return;
        }
        $root.data('wizardInitialized', true);

        let currentStep = 1;

        function getStepEl(step) {
            return $root.find('.create-server-panel[data-step="' + step + '"]')[0] || null;
        }

        function setFieldInvalid(selector, invalid) {
            const el = $root.find(selector)[0] || document.querySelector(selector);
            if (!el) return;

            if ($(el).hasClass('select2-hidden-accessible')) {
                if (typeof markSelect2Invalid === 'function') {
                    markSelect2Invalid($(el), invalid);
                } else {
                    $(el).next('.select2-container').find('.select2-selection').toggleClass('is-invalid', invalid);
                }
            } else {
                el.classList.toggle('is-invalid', invalid);
            }
        }

        function updateStepIndex($btn, step, isActive, isComplete) {
            const $index = $btn.find('.create-server-step-index');
            if (!$index.length) return;

            if (!$index.data('stepNumber')) {
                $index.data('stepNumber', $index.text().trim());
            }

            if (isComplete) {
                $index.html('<i class="ti ti-check" aria-hidden="true"></i>');
            } else {
                $index.text($index.data('stepNumber'));
            }
        }

        function updateSidebar() {
            const progress = TOTAL_STEPS > 1 ? ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100 : 100;
            $root.find('.create-server-progress-bar').css('width', progress + '%');
            $root.find('.create-server-step-counter').text('Step ' + currentStep + ' of ' + TOTAL_STEPS);

            $root.find('.create-server-step-btn').each(function () {
                const step = parseInt($(this).data('step'), 10);
                const isActive = step === currentStep;
                const isComplete = step < currentStep;

                $(this)
                    .toggleClass('is-active', isActive)
                    .toggleClass('is-complete', isComplete)
                    .attr('aria-current', isActive ? 'step' : null);

                updateStepIndex($(this), step, isActive, isComplete);
            });

            $backBtn.prop('disabled', currentStep === 1);
            $nextBtn.toggle(currentStep < TOTAL_STEPS);
            $submitBtn.toggle(currentStep === TOTAL_STEPS);
        }

        function showStep(step) {
            currentStep = Math.max(1, Math.min(TOTAL_STEPS, step));
            $root.find('.create-server-panel').removeClass('is-active');
            $(getStepEl(currentStep)).addClass('is-active');
            $root.find('.create-server-step-error').removeClass('is-visible');
            updateSidebar();
            setTimeout(onStepShown, 0);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function validateStep(step) {
            const fields = stepFields[step] || [];
            let valid = true;
            let firstInvalid = null;

            fields.forEach(function (selector) {
                const el = $root.find(selector)[0];
                if (!el) return;

                const value = $(el).val();
                const empty = value === null || value === undefined || String(value).trim() === '';

                setFieldInvalid(selector, empty);

                if (empty) {
                    valid = false;
                    if (!firstInvalid) firstInvalid = el;
                }
            });

            const errorBox = $root.find('.create-server-panel[data-step="' + step + '"] .create-server-step-error')[0];
            if (!valid && errorBox) {
                errorBox.classList.add('is-visible');
                if (firstInvalid) {
                    if ($(firstInvalid).hasClass('select2-hidden-accessible')) {
                        $(firstInvalid).select2('open');
                    } else {
                        firstInvalid.focus();
                    }
                }
            }

            return valid;
        }

        const initial = parseInt($root.data('initial-step') || '1', 10);
        showStep(initial);

        $root.find('.create-server-step-btn').on('click', function () {
            const target = parseInt($(this).data('step'), 10);
            if (target < currentStep) {
                showStep(target);
                return;
            }
            for (let s = currentStep; s < target; s++) {
                if (!validateStep(s)) {
                    showStep(s);
                    return;
                }
            }
            showStep(target);
        });

        $nextBtn.on('click', function () {
            if (validateStep(currentStep)) {
                showStep(currentStep + 1);
            }
        });

        $backBtn.on('click', function () {
            showStep(currentStep - 1);
        });

        $form.on('submit', function (e) {
            for (let s = 1; s <= TOTAL_STEPS; s++) {
                if (!validateStep(s)) {
                    e.preventDefault();
                    showStep(s);
                    return false;
                }
            }
        });

        $root.on('input change', '.create-server-panel input, .create-server-panel select, .create-server-panel textarea', function () {
            if ($(this).hasClass('select2-hidden-accessible')) {
                setFieldInvalid('#' + this.id, false);
            } else {
                this.classList.remove('is-invalid');
            }
        });
    };
})(jQuery);
