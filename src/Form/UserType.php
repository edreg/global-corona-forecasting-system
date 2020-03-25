<?php

namespace App\Form;

use App\Entity\User;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\Form\Extension\Core\Type\RepeatedType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Contracts\Translation\TranslatorInterface;

class UserType extends AbstractType
{
    /**
     * @var \Symfony\Contracts\Translation\TranslatorInterface
     */
    private $translator;

    public function __construct(TranslatorInterface $translator)
    {
        $this->translator = $translator;
    }

    public function buildForm(FormBuilderInterface $builder, array $options) : void
    {
        $builder
            ->add('username')
            ->add('email')
            ->add(
                'password',
                RepeatedType::class,
                [
                    'type' => PasswordType::class,
                    'invalid_message' => $this->translator->trans('The password fields must match'),
                    'options' => ['attr' => ['class' => 'password-field']],
                    'required' => true,
                    'first_options' => [
                        'label' => $this->translator->trans('Password'),
                        'attr' => [
                            'placeholder' => $this->translator->trans('Password')
                        ]
                    ],
                    'second_options' => [
                        'label' => $this->translator->trans('Password confirmation'),
                        'attr' => [
                            'placeholder' => $this->translator->trans('Password confirmation')
                        ]
                    ],
                ]
            )
            ->add('roles')
        ;
    }

    public function configureOptions(OptionsResolver $resolver) : void
    {
        $resolver->setDefaults([
            'data_class' => User::class,
        ]);
    }
}
