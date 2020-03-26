<?php

namespace App\Domain\Corona\Model;

class CountryModel
{
    /**
     * @var string
     */
    public $name;

    /**
     * @var int
     */
    public $id;

    /**
     * @var float
     */
    public $latitude;

    /**
     * @var float
     */
    public $longitude;

    /**
     * @var int
     */
    public $population;

    public function __construct(string $name, int $id, float $latitude, float $longitude, int $population)
    {
        $this->name = $name;
        $this->id = $id;
        $this->latitude = $latitude;
        $this->longitude = $longitude;
        $this->population = $population;
    }
}