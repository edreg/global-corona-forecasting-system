<?php

namespace App\Repository;

use App\Entity\CoronaStats;
use DateTime;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Common\Persistence\ManagerRegistry;
use Doctrine\ORM\Query;

/**
 * @method CoronaStats|null find($id, $lockMode = null, $lockVersion = null)
 * @method CoronaStats|null findOneBy(array $criteria, array $orderBy = null)
 * @method CoronaStats[]    findAll()
 * @method CoronaStats[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class CoronaStatsRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CoronaStats::class);
    }

    /**
     * @param \DateTime|null $dateValue
     *
     * @return \Doctrine\ORM\Query
     * @throws \Doctrine\ORM\NonUniqueResultException
     */
    public function getFindAllQuery(?DateTime $dateValue = null) : Query
    {
        $qb = $this->createQueryBuilder('coronaStats', 'coronaStats.id')->join('coronaStats.country', 'country');
        $qb->select();
        $latestStat = $this->getLatestDateStat();

        if ($dateValue instanceof DateTime)
        {
            $dateValue->modify('midnight');
            $qb
                ->andWhere($qb->expr()->eq('coronaStats.date', ':queryDate'))
                ->setParameter(':queryDate', $dateValue);
        }
        elseif ($latestStat instanceof CoronaStats)
        {
            $qb
                ->andWhere($qb->expr()->eq('coronaStats.date', ':latestDate'))
                ->setParameter(':latestDate', $latestStat->getDate());
        }

        return $qb->addGroupBy('country.id')->addOrderBy('coronaStats.amount', 'DESC')->getQuery();
    }

    /**
     * @return \App\Entity\CoronaStats|null
     * @throws \Doctrine\ORM\NonUniqueResultException
     */
    public function getLatestDateStat(): ?CoronaStats
    {
        return
            $this->createQueryBuilder('c')
                ->addOrderBy('c.date', 'DESC')
                ->setMaxResults(1)
                ->getQuery()
                ->getOneOrNullResult()
            ;
    }
}
